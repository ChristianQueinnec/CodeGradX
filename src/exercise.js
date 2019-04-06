// exercise.js
// Time-stamp: "2019-04-06 17:08:49 queinnec"

module.exports = function (CodeGradX) {
    const _ = CodeGradX._;
    const when = CodeGradX.when;
    
/** Get the XML descriptor of the Exercise.
    This XML descriptor will enrich the Exercise instance.
    The raw XML string is stored under property 'XMLdescription', the
    decoded XML string is stored under property 'description'.

    Caution: this description is converted from XML to a Javascript
    object with xml2js idiosyncrasies.

      @returns {Promise<ExerciseDescription>} yields {ExerciseDescription}

       */

CodeGradX.Exercise.prototype.getDescription = function () {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    state.debug('getDescription1', exercise);
    if ( exercise._description ) {
        return Promise.resolve(exercise._description);
    }
    if ( ! exercise.safecookie ) {
        return Promise.reject("Non deployed exercise " + exercise.name);
    }
    const promise = state.sendESServer('e', {
        path: ('/exercisecontent/' + exercise.safecookie + '/content'),
        method: 'GET',
        headers: {
            Accept: "text/xml",
            // useful for debug:
            "X-CodeGradX-Comment": `ExerciseName=${exercise.name}`
        }
    });
    // Parse the HTTP response, translate the XML into a Javascript object
    // and provide it to the sequel:
    const promise1 = promise.then(function (response) {
        state.debug('getDescription2', response);
        //console.log(response);
        exercise.server = response.url.replace(
            new RegExp('^(https?://[^/]+)/.*$'), "$1");
        exercise._XMLdescription = response.entity;
        function parseXML (description) {
            state.debug('getDescription2b', description);
            exercise._description = description;
            //description._exercise = exercise;
            return Promise.resolve(description);
        }
        return CodeGradX.parsexml(exercise._XMLdescription).then(parseXML);
    });
    const promise3 = promise.then(function (response) {
        // Extract stem
        state.debug("getDescription4", response);
        const contentRegExp = new RegExp("^(.|\n)*(<\s*content\s*>(.|\n)*</content\s*>)(.|\n)*$");
        const content = response.entity.replace(contentRegExp, "$2");
        exercise.XMLcontent = content;
        exercise.stem = CodeGradX.xml2html(content, { exercise });
        // extract equipment:
        state.debug("getDescription5b", exercise);
        extractEquipment(exercise, response.entity);
        // extract identity and authorship:
        state.debug("getDescription6", exercise);
        return extractIdentification(exercise, response.entity);
    });
    const promise4 = promise.then(function (response) {
        // If only one question expecting only one file, retrieve its name:
        state.debug('getDescription5c');
        const expectationsRegExp =
            new RegExp("<\s*expectations\s*>((.|\n)*?)</expectations\s*>", "g");
        function concat (s1, s2) {
            return s1 + s2;
        }
        const expectationss = response.entity.match(expectationsRegExp);
        if ( expectationss ) {
            const files = _.reduce(expectationss, concat);
            const expectations = '<div>' + files + '</div>';
            return CodeGradX.parsexml(expectations).then(function (result) {
                state.debug('getDescription5a');
                if ( Array.isArray(result.div.expectations.file) ) {
                    // to be done. Maybe ? Why ?
                } else {
                    //console.log(result.div.expectations);
                    exercise.expectations = result.div.expectations;
                    exercise.inlineFileName = result.div.expectations.file.$.basename;
                }
                return Promise.resolve(response);
            }).catch(function (/*reason*/) {
                exercise.expectations = [];
                return Promise.resolve(response);
            });
        } else {
            exercise.expectations = [];
            return Promise.resolve(response);
        }
    });
    return when.join(promise3, promise4)
        .then(function (/*values*/) {
            return promise1;
        });
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
        console.log(reason);
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
  new RegExp("^(.|\n)*(<\s*identification +(.|\n)*</identification\s*>)(.|\n)*$");
const summaryRegExp =
  new RegExp("^(.|\n)*(<\s*summary.*?>(.|\n)*</summary\s*>)(.|\n)*$");

function extractIdentification (exercise, s) {
    const content = s.replace(identificationRegExp, "$2");
    return CodeGradX.parsexml(content).then(function (result) {
        if ( ! result.identification ) {
            return Promise.resolve(exercise);
        }
        result = result.identification;
        // extract identification:
        exercise.name = result.$.name;
        exercise.nickname = result.$.nickname;
        exercise.date = result.$.date;
        const summary = content.replace(summaryRegExp, "$2");
        exercise.summary = CodeGradX.xml2html(summary);
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

function extractEquipment (exercise, s) {
    exercise.equipment = [];
    const equipmentRegExp = new RegExp(
        "^(.|\n)*(<equipment>\s*(.|\n)*?\s*</equipment>)(.|\n)*$");
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
            const parser = new xml2js.Parser({
                explicitArray: false,
                trim: true
            });
            parser.parseString(content, function (err, result) {
                exercise.equipment = flatten(result.equipment, '');
            });
        } catch (e) {
            const state = CodeGradX.getCurrentState();
            state.debug("extractEquipment", e);
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
          return exercise.getDescription()
          .then(function (/*description*/) {
              return exercise.sendStringAnswer(answer);
          });
      }
  }
  function processResponse (response) {
    //console.log(response);
    state.debug('sendStringAnswer2', response);
    return CodeGradX.parsexml(response.entity).then(function (js) {
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
  const content = Buffer.from(answer, 'utf8');
  const headers = {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": ("inline; filename=" + exercise.inlineFileName),
      "Accept": 'text/xml'
  };
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

      @param {DOM} form DOM element
      @returns {Promise<Job>} yields {Job}

The form DOM element must contain an <input type='file' name='content'>
element. This code only runs in a browser providing the FormData class.

*/

CodeGradX.Exercise.prototype.sendFileFromDOM = function (form) {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    state.debug('sendZipFileAnswer1', FW4EX.currentFileName);
    if ( ! exercise.safecookie ) {
        return Promise.reject("Non deployed exercise " + exercise.name);
    }
    function processResponse (response) {
        //console.log(response);
        state.debug('sendZipFileAnswer2', response);
        return CodeGradX.parsexml(response.entity).then(function (js) {
            //console.log(js);
            state.debug('sendZipFileAnswer3', js);
            js = js.fw4ex.jobSubmittedReport;
            exercise.uuid = js.exercise.$.exerciseid;
            const job = new CodeGradX.Job({
                exercise: exercise,
                content: FW4EX.currentFileName,
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
    const basefilename = FW4EX.currentFileName.replace(new RegExp("^.*/"), '');
    const headers = {
        "Content-Type": "multipart/form-data",
        "Content-Disposition": ("inline; filename=" + basefilename),
        "Accept": 'text/xml'
    };
    const fd = new FormData(form);
    return state.sendAXServer('a', {
        path: ('/exercise/' + exercise.safecookie + '/job'),
        method: "POST",
        headers: headers,
        entity: fd
    }).then(processResponse);
};

/** Send a batch of files that is, multiple answers to be marked
    against an Exercise. That file is selected with an input:file
    widget in the browser.

    @param {DOMform} form - the input:file widget
    @returns {Promise<Batch>} yielding a Batch.

The form DOM element must contain an <input type='file' name='content'>
element. This code only runs in a browser providing the FormData class.

*/

CodeGradX.Exercise.prototype.sendBatchFromDOM = function (form) {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    state.debug('sendBatchFile1');
    if ( ! exercise.safecookie ) {
        return Promise.reject("Non deployed exercise " + exercise.name);
    }
    function processResponse (response) {
        //console.log(response);
        state.debug('sendBatchFile2', response);
        return CodeGradX.parsexml(response.entity).then(function (js) {
            //console.log(js);
            state.debug('sendBatchFile3', js);
            js = js.fw4ex.multiJobSubmittedReport;
            exercise.uuid = js.exercise.$.exerciseid;
            const batch = new CodeGradX.Batch({
                exercise: exercise,
                responseXML: response.entity,
                response: js,
                personid: CodeGradX._str2num(js.person.$.personid),
                archived: CodeGradX._str2Date(js.batch.$.archived),
                batchid:  js.batch.$.batchid,
                pathdir:  js.$.location,
                finishedjobs: 0
            });
            return Promise.resolve(batch);
        });
    }
    const basefilename = FW4EX.currentFileName.replace(new RegExp("^.*/"), '');
    const headers = {
        "Content-Type": "multipart/form-data",
        "Content-Disposition": ("inline; filename=" + basefilename),
        "Accept": 'text/xml'
    };
    const fd = new FormData(form);
    return state.sendAXServer('a', {
        path: ('/exercise/' + exercise.safecookie + '/batch'),
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
              return CodeGradX.parsexml(response.entity);
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
          "Accept": 'text/xml'
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

};

// end of exercise.js
