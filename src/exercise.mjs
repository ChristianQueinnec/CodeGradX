// exercise.js
// Time-stamp: "2021-09-15 14:39:07 queinnec"
/* eslint no-control-regex: "off" */

import { CodeGradX as cx } from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export const CodeGradX = cx;
export default CodeGradX;

import { parsexml } from './parsexml.mjs';
import { xml2html } from './xml2html.mjs';

/** Keep only persistable values and convert then into JSON */

CodeGradX.Exercise.prototype.jsonize = function () {
    const exercise = this;
    const keys = [
        'safecookie',
        'lang',
        'XMLcontent',
        'stem',
        'equipment',
        'inlineFileName',
        'name',
        'nickname',
        'date',
        'summary',
        'tags',
        'authorship',
        'expectations'
    ];
    return CodeGradX.jsonize(exercise, keys);
};
    
/** Get the XML descriptor of the Exercise.
    This XML descriptor will enrich the Exercise instance.
    The raw XML string is stored under property 'XMLdescription', the
    decoded XML string is stored under property 'description'.

    Caution: this description is converted from XML to a Javascript
    object with xml2js idiosyncrasies.

      @param {boolean} force - avoid cache if true
      @returns {Promise<ExerciseDescription>} yields {ExerciseDescription}

*/

CodeGradX.Exercise.prototype.getDescription = async function (force = false) {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    state.debug('getDescription1', exercise);
    if ( exercise._description ) {
        return Promise.resolve(exercise._description);
    }
    if ( ! exercise.safecookie ) {
        return Promise.reject("Non deployed exercise " + exercise.name);
    }
    if ( ! force ) {
        if ( exercise.exerciseid ) {
            let cachedexercise = state.cachedExercise(exercise.exerciseid);
            if ( cachedexercise ) {
                state.debug('getDescription from cache', cachedexercise);
                Object.assign(exercise, cachedexercise);
                return Promise.resolve(exercise._description);
            }
        }
    }
    const response = await state.sendESServer('e', {
        path: ('/exercisecontent/' + exercise.safecookie + '/content'),
        method: 'GET',
        headers: {
            Accept: "application/json",
            // useful for debug (but requires CORS authorization):
            //"X-CodeGradX-Comment": `ExerciseName=${exercise.name}`
        }
    });
    state.debug('getDescription2', response);
    //console.log(response);
    const re1 = new RegExp('^(https?://[^/]+)/.*$');
    exercise.server = response.url.replace(re1, "$1");
    exercise._XMLdescription = response.entity;

    // Parse XML
    try {
        const description = await parsexml(exercise._XMLdescription);
        state.debug('getDescription4 _description', description);
        exercise._description = description;
    } catch (exc) {
        state.debug('getDescription4b', exc);
    }

    // Determine the language of the exercise:
    try {
        exercise.lang = undefined;
        exercise.lang = exercise._description.fw4ex.$.lang
            .replace(/_\w+$/, '');
        state.debug('getDescription3 lang=', exercise.lang);
    } catch (exc) {
        state.debug('getDescription3b', exc);
    }

    // Extract stem
    try {
        const re4 = new RegExp("^(.|\n)*(<\\s*content\\s*>(.|\n)*</content\\s*>)(.|\n)*$");
        const content = exercise._XMLdescription.replace(re4, "$2");
        exercise.XMLcontent = content;
        const stem = await xml2html(content, { exercise });
        exercise.stem = stem;
        state.debug('getDescription5 stem', stem);
    } catch (exc) {
        state.debug('getDescription5b', exc);
    }
    
    // Extract equipment:
    try {
        await extractEquipment(exercise, exercise._XMLdescription);
        state.debug("getDescription6 equipment", exercise.equipment);
    } catch (exc) {
        state.debug('getDescription6b', exc);
    }

    // Extract identity and authorship:
    try {
        await extractIdentification(exercise, exercise._XMLdescription);
        state.debug("getDescription7 identity", exercise.authorship);
    } catch (exc) {
        state.debug('getDescription7b', exc);
    }

    // Extract expectations
    try {
        state.debug('getDescription8 expectations');
        exercise.expectations = [];
        const re5 =
              new RegExp("<\\s*expectations\\s*>((.|\n)*?)</expectations\\s*>", "g");
        const expectationss = exercise._XMLdescription.match(re5);
        if ( expectationss ) {
            //const files = _.reduce(expectationss, concat);
            // Collect all expectations:
            const files = expectationss.join('');
            // Surround with <div> for parsexml to work:
            const expectations = '<div>' + files + '</div>';
            const result = await parsexml(expectations);
            state.debug('getDescription8a', result);
            if ( Array.isArray(result.div.expectations.file) ) {
                // to be done. Maybe ? Why ?
            } else {
                //console.log(result.div.expectations);
                exercise.expectations = result.div.expectations;
                exercise.inlineFileName = exercise.expectations.file.$.basename;
            }
        }
    } catch (exc) {
        state.debug('getDescription8b', exc);
    }

    if ( ! exercise.exerciseid ) {
        // On Firefox, most headers are not available!
        const uuid = response.headers.get('X-exerciseUUID');
        if ( uuid ) {
            exercise.exerciseid = uuid;
        }
    }
    if ( exercise.exerciseid ) {
        // When reloading an /exercise/SAFECOOKIE page, the UUID of
        // the exercise is not available.
        state.cachedExercise(exercise.exerciseid, exercise);
    }
    return Promise.resolve(exercise._description);
};


/** Get an equipment file that is a file needed by the students
    and stored in the exercise.
    
    @param {string} file - the name of the file
    @returns {Promise<>} 

*/

CodeGradX.Exercise.prototype.getEquipmentFile = function (file) {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    state.debug('getEquipmentFile1', exercise, file);
    if ( ! exercise.safecookie ) {
        return Promise.reject("Non deployed exercise " + exercise.name);
    }
    const promise = state.sendESServer('e', {
        path: ('/exercisecontent/' + exercise.safecookie + '/path' + file),
        method: 'GET',
        headers: {
            Accept: "*/*"
        }
    });
    return promise.catch(function (reason) {
        //console.log(reason);
        return Promise.reject(reason);
    });
};

/** Convert an XML fragment describing the identification of an
    exercise and stuff the Exercise instance.

    <identification name="" date="" nickname="">
      <summary></summary>
      <tags></tags>
      <authorship></authorship>
    </identification>

*/

const identificationRegExp =
  new RegExp("^(.|\n)*(<\\s*identification +(.|\n)*</identification\\s*>)(.|\n)*$");
const summaryRegExp =
  new RegExp("^(.|\n)*(<\\s*summary.*?>(.|\n)*</summary\\s*>)(.|\n)*$");

function extractIdentification (exercise, s) {
    const content = s.replace(identificationRegExp, "$2");
    return parsexml(content).then(function (result) {
        if ( ! result.identification ) {
            return Promise.resolve(exercise);
        }
        result = result.identification;
        // extract identification:
        exercise.name = result.$.name;
        exercise.nickname = result.$.nickname;
        exercise.date = result.$.date;
        const summary = content.replace(summaryRegExp, "$2");
        return xml2html(summary)
            .then((summary) => {
                exercise.summary = summary;
                if ( Array.isArray(result.tags.tag) ) {
                    exercise.tags = result.tags.tag.map(function (tag) {
                        return tag.$.name;
                    });
                } else {
                    exercise.tags = [result.tags.tag.$.name];
                }
                // extract authors
                const authors = result.authorship;
                if ( Array.isArray(authors.author) ) {
                    exercise.authorship = authors.author;
                } else {
                    exercise.authorship = [ authors.author ];
                }
                return Promise.resolve(exercise);
            });
    });
}

/** Convert an XML fragment describing directories and files into
    pathnames. For instance,

    <expectations>
      <file basename='foo'/>
      <directory basename='bar'>
        <file basename='hux'/>
        <file basename='wek'/>
      </directory>
    </expectations>

   will be converted into 
    
    [ '/foo', '/bar/hux', '/bar/wek']


function extractExpectations (exercice, s) {
    return exercise;
}

*/

/** Convert an XML fragment describing directories and files into
    pathnames. For instance,

    <equipment>
      <file basename='foo'/>
      <directory basename='bar'>
        <file basename='hux'/>
        <file basename='wek'/>
      </directory>
    </equipment>

   will be converted into 
    
    [ '/foo', '/bar/hux', '/bar/wek']

*/

async function extractEquipment (exercise, s) {
    const state = CodeGradX.getCurrentState();
    exercise.equipment = [];
    const equipmentRegExp = new RegExp(
        "^(.|\n)*(<equipment>\\s*(.|\n)*?\\s*</equipment>)(.|\n)*$");
    const content = s.replace(equipmentRegExp, "$2");
    if ( s.length === content.length ) {
        // No equipment!
        return exercise;
    }
    function flatten (o, dir) {
        let results = [];
        if ( o.directory ) {
            if ( Array.isArray(o.directory) ) {
                o.directory.forEach(function (o) {
                    const newdir = dir + '/' + o.$.basename;
                    results = results.concat(flatten(o, newdir));
                });
            } else {
                const newdir = dir + '/' + o.directory.$.basename;
                results = results.concat(flatten(o.directory, newdir));
            }
        }
        if ( o.file ) {
            if ( Array.isArray(o.file) ) {
                o.file.forEach(function (o) {
                    results = results.concat(flatten(o, dir));
                });
            } else {
                o = o.file;
            }
        }
        if ( !o.file && !o.directory && o.$ && o.$.basename && ! o.$.hidden ) {
            results.push(dir + '/' + o.$.basename);
        }
        return results;
    }
    if ( content.length > 0 ) {
        try {
            const result = await parsexml(content);
            exercise.equipment = flatten(result.equipment, '');
        } catch (exc) {
            state.debug('extractEquipment2', exc);
        }
    }
    return exercise;
}

/** Send a string as the proposed solution to an Exercise.
    Returns a Job on which you may invoke the `getReport` method.

      @param {string} answer
      @returns {Promise<Job>} yields {Job}

    */

CodeGradX.Exercise.prototype.sendStringAnswer = function (answer) {
  const exercise = this;
  const state = CodeGradX.getCurrentState();
  state.debug('sendStringAnswer1', answer);
  if ( ! exercise.safecookie ) {
    return Promise.reject("Non deployed exercise " + exercise.name);
  }
  if ( typeof exercise.inlineFileName === 'undefined') {
      if ( exercise._description ) {
          return Promise.reject(new Error("Non suitable exercise"));
      } else {
          return exercise.getDescription(true)
          .then(function (/*description*/) {
              return exercise.sendStringAnswer(answer);
          });
      }
  }
  function processResponse (response) {
    //console.log(response);
    state.debug('sendStringAnswer2', response);
    return parsexml(response.entity).then(function (js) {
      //console.log(js);
      state.debug('sendStringAnswer3', js);
      js = js.fw4ex.jobSubmittedReport;
      exercise.uuid = js.exercise.$.exerciseid;
      const job = new CodeGradX.Job({
        exercise: exercise,
        content: answer,
        responseXML: response.entity,
        response: js,
        personid: CodeGradX._str2num(js.person.$.personid),
        archived: CodeGradX._str2Date(js.job.$.archived),
        jobid:    js.job.$.jobid,
        pathdir:  js.$.location
      });
      return Promise.resolve(job);
    });
  }
  //const content = Buffer.from(answer, 'utf8');
  const content = answer;
  const headers = {
      "Content-Type": "application/octet-stream",
      "Accept": 'application/json'
  };
  if ( exercise.inlineFileName ) {
      headers["Content-Disposition"] =
          "inline; filename=" + exercise.inlineFileName;
  }
  if ( CodeGradX.isNode() ) {
        headers["Content-Length"] = content.length;
  }
  return state.sendAXServer('a', {
    path: ('/exercise/' + exercise.safecookie + '/job'),
    method: "POST",
    headers: headers,
    entity: content
  }).then(processResponse);
};

/** Send the content of a file selected by an input:file widget in the
 * browser. Returns a Job on which you may invoke the `getReport` method.

      @param {DOM} form - DOM element
      @param {String} currentFileName - file name
      @returns {Promise<Job>} yields {Job}

The form DOM element must contain an <input type='file' name='content'>
element. This code only runs in a browser providing the FormData class.

*/

CodeGradX.Exercise.prototype.sendFileFromDOM =
  function (form, currentFileName) {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    currentFileName = currentFileName || state.currentFileName;
    state.debug('sendZipFileAnswer1', currentFileName);
    if ( ! exercise.safecookie ) {
        return Promise.reject("Non deployed exercise " + exercise.name);
    }
    function processResponse (response) {
        //console.log(response);
        state.debug('sendZipFileAnswer2', response);
        return parsexml(response.entity).then(function (js) {
            //console.log(js);
            state.debug('sendZipFileAnswer3', js);
            js = js.fw4ex.jobSubmittedReport;
            exercise.uuid = js.exercise.$.exerciseid;
            const job = new CodeGradX.Job({
                exercise: exercise,
                content: currentFileName,
                responseXML: response.entity,
                response: js,
                personid: CodeGradX._str2num(js.person.$.personid),
                archived: CodeGradX._str2Date(js.job.$.archived),
                jobid:    js.job.$.jobid,
                pathdir:  js.$.location
            });
            return Promise.resolve(job);
        });
    }
    const basefilename = currentFileName.replace(new RegExp("^.*/"), '');
    const headers = {
        // Useless since we post a FormData:
        //"Content-Type": "multipart/form-data",
        "Content-Disposition": ("inline; filename=" + basefilename),
        "Accept": 'application/json'
    };
    const fd = new FormData(form);
    return state.sendAXServer('a', {
        path: ('/exercise/' + exercise.safecookie + '/job'),
        method: "POST",
        headers: headers,
        entity: fd
    }).then(processResponse);
};

/** After submitting a new Exercise, get Exercise autocheck reports
    that is, the job reports corresponding to the pseudo-jobs
    contained in the Exercise TGZ file.

  @param {Object} parameters - @see CodeGradX.sendRepeatedlyESServer
  @returns {Promise<Exercise>} yielding an Exercise

  The `getExerciseReport()` method will add some new fields to the
  Exercise object:

  @property {XMLstring} XMLauthorReport - raw XML report
  @property {string} globalReport - global report
  @property {number} totaljobs - the total number of pseudo-jobs
  @property {number} finishedjobs - the number of marked pseudo-jobs
  @property {Hashtable<Job>} pseudojobs - Hashtable of pseudo-jobs

  For each pseudo-job, are recorded all the fields of a regular Job
  plus some additional fields such as `duration`.

  The globalReport is the report independent of the pseudojob reports.

  If the exercise is successfully autochecked, it may be used by
  `sendStringAnswer()`, `sendFileAnswer()` or `sendBatch()` methods
  using the additional `safecookie` field:

  @property {string} safecookie - the long identifier of the exercise.

A failure might be:

  <fw4ex version="1.0">
    <exerciseAuthorReport exerciseid="9A9701A8-CE17-11E7-AB9A-DBAB25888DB0">
      <report>
      </report>
    </exerciseAuthorReport>
  </fw4ex>

*/

CodeGradX.Exercise.prototype.getExerciseReport = function (parameters) {
  const exercise = this;
  const state = CodeGradX.getCurrentState();
  state.debug("getExerciseReport1", exercise, parameters);
  if ( exercise.finishedjobs ) {
      return Promise.resolve(exercise);
  }
  function processResponse (response) {
    state.debug("getExerciseReport2", response);
    //console.log(response);
    exercise.originServer = response.url.replace(/^(.*)\/s\/.*$/, "$1");
    exercise.XMLauthorReport = response.entity;
    function catchXMLerror (reason) {
        state.debug("catchXMLerror", reason);
        return Promise.reject(reason);
    }
    state.debug("getExerciseReport3a");
    return extractIdentification(exercise, response.entity)
          .then(function (/*exercise*/) {
              state.debug("getExerciseReport3b");
              return parsexml(response.entity);
          }).then(function (js) {
              state.debug("getExerciseReport3c", js);
              js = js.fw4ex.exerciseAuthorReport;
              exercise.pseudojobs = {};
              exercise._pseudojobs = [];
              if ( js.report ) {
                  exercise.globalReport = js.report;
                  if ( ! js.pseudojobs || js.pseudojobs.length === 0 ) {
                      return Promise.resolve(exercise);
                  }
              }
              exercise.totaljobs =
                  CodeGradX._str2num(js.pseudojobs.$.totaljobs);
              exercise.finishedjobs =
                  CodeGradX._str2num(js.pseudojobs.$.finishedjobs);
              function processPseudoJob (jspj) {
                  const name = jspj.submission.$.name;
                  const job = new CodeGradX.Job({
                      exercise:  exercise,
                      XMLpseudojob: jspj,
                      jobid:     jspj.$.jobid,
                      pathdir:   jspj.$.location,
                      duration:  CodeGradX._str2num(jspj.$.duration),
                      problem:   false,
                      label:     name
                      // partial marks TOBEDONE
                  });
                  if ( jspj.marking ) {
                      job.expectedMark = CodeGradX._str2num2decimals(
                          jspj.submission.$.expectedMark);
                      job.mark = CodeGradX._str2num2decimals(
                          jspj.marking.$.mark);
                      job.totalMark = CodeGradX._str2num2decimals(
                          jspj.marking.$.totalMark);
                      job.archived =
                          CodeGradX._str2Date(jspj.marking.$.archived);
                      job.started =
                          CodeGradX._str2Date(jspj.marking.$.started);
                      job.ended =
                          CodeGradX._str2Date(jspj.marking.$.ended);
                      job.finished =
                          CodeGradX._str2Date(jspj.marking.$.finished);
                  }
                  if ( jspj.$.problem ) {
                      job.problem = true;
                      if ( jspj.report ) {
                          job.problem = jspj.report;
                      }
                  }
                  exercise.pseudojobs[name] = job;
                  exercise._pseudojobs.push(job);
              }
              const pseudojobs = js.pseudojobs.pseudojob;
              if ( Array.isArray(pseudojobs) ) {
                  pseudojobs.forEach(processPseudoJob);
              } else if ( pseudojobs ) {
                  processPseudoJob(pseudojobs);
              } else {
                  // nothing! exercise.finishedjobs is probably 0!
              }
              //console.log(exercise); // DEBUG
              if ( js.$.safecookie ) {
                  exercise.safecookie = js.$.safecookie;
              }
              return Promise.resolve(exercise);
          })
          .catch(catchXMLerror);
  }
  return state.sendRepeatedlyESServer('s', parameters, {
      path: exercise.getExerciseReportURL(),
      method: 'GET',
      headers: {
          "Accept": 'application/json'
      }
  }).then(processResponse);
};

CodeGradX.Exercise.prototype.getBaseURL = function () {
    const exercise = this;
    const path = exercise.location + '/' + exercise.exerciseid;
    return path;
};
CodeGradX.Exercise.prototype.getExerciseReportURL = function () {
    const exercise = this;
    return exercise.getBaseURL() + '.xml';
};
CodeGradX.Exercise.prototype.getTgzURL = function () {
    const exercise = this;
    return exercise.getBaseURL() + '.tgz';
};

// end of exercise.js
