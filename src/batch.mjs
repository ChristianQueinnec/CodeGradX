// batch.mjs
// Time-stamp: "2019-12-27 16:02:10 queinnec"

import CodeGradX from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export default CodeGradX;

/** Send a batch of files that is, multiple answers to be marked
    against an Exercise. That file is selected with an input:file
    widget in the browser.

    @param {DOMform} form - the input:file widget
    @param {String} currentFileName - file name
    @returns {Promise<Batch>} yielding a Batch.

The form DOM element must contain an <input type='file' name='content'>
element. This code only runs in a browser providing the FormData class.

*/

CodeGradX.Exercise.prototype.sendBatchFromDOM = 
  function (form, currentFileName) {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    currentFileName = currentFileName || state.currentFileName;
    state.debug('sendBatchFile1', currentFileName);
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
            state.debug('sendBatchFile6', batch.batchid);
            return Promise.resolve(batch);
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
        path: ('/exercise/' + exercise.safecookie + '/batch'),
        method: "POST",
        headers: headers,
        entity: fd
    }).then(processResponse);
};

/** submit a new Batch and return it as soon as submitted successfully.
    This variant sends the content as a file.

    @param {ByteString} tgz
    @param {String} filename
    @returns {Promise<Batch>} yielding Batch

    */

CodeGradX.Exercise.prototype.sendBatch = function (tgz, filename) {
    const exercise = this;
    const state = CodeGradX.getCurrentState();
    state.debug('sendBatchFile1', filename);
    if ( ! exercise.safecookie ) {
        return Promise.reject("Non deployed exercise " + exercise.name);
    }
    function processResponse (response) {
        //console.log(response);
        state.debug('sendBatchFile3', response);
        return CodeGradX.parsexml(response.entity).then(function (js) {
            //console.log(js);
            state.debug('sendBatchFile4', js);
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
            state.debug('sendBatchFile5', batch.batchid);
            return Promise.resolve(batch);
        });
    }
    const basefilename = filename.replace(new RegExp("^.*/"), '');
    const headers = {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `inline; filename=${basefilename}`,
        "Accept": 'application/json'
    };
    return state.sendAXServer('a', {
        path: ('/exercise/' + exercise.safecookie + '/batch'),
        method: "POST",
        headers: headers,
        entity: tgz
    }).then(processResponse);
};

/** Get the current state of the Batch report that is, always fetch
    it. See also `getFinalReport()` to get the final report of the
    batch where all answers are marked.

  @param {Object} parameters - parameters {@see sendRepeatedlyESServer}
  @returns {Promise<Batch>} yielding Batch

  */

CodeGradX.Batch.prototype.getReport = function (parameters) {
  const batch = this;
  const state = CodeGradX.getCurrentState();
  state.debug('getBatchReport1', batch);
  parameters = Object.assign({
      // So progress() may look at the current version of the batch report:
      batch: batch
    },
    CodeGradX.Batch.prototype.getReport.default,
    parameters);
  const path = batch.getReportURL();
  function processResponse (response) {
      //console.log(response);
      state.debug('getBatchReport2', response, batch);
      batch.originServer = response.url.replace(/^(.*)\/s\/.*$/, "$1");
      function processJS (js) {
          //console.log(js);
          state.debug('getBatchReport3', js);
          js = js.fw4ex.multiJobStudentReport;
          batch.totaljobs    = CodeGradX._str2num(js.$.totaljobs);
          batch.finishedjobs = CodeGradX._str2num(js.$.finishedjobs);
          batch.jobs = Object.create(null);
          //console.log(js);
          function processJob (jsjob) {
              //console.log(jsjob);
              let job = new CodeGradX.Job({
                  exercise:  batch.exercise,
                  XMLjob:    jsjob,
                  jobid:     jsjob.$.jobid,
                  pathdir:   jsjob.$.location,
                  label:     jsjob.$.label,
                  problem:   false,
                  mark:      CodeGradX._str2num2decimals(
                      jsjob.marking.$.mark),
                  totalMark: CodeGradX._str2num2decimals(
                      jsjob.marking.$.totalMark),
                  started:   CodeGradX._str2Date(jsjob.marking.$.started),
                  finished:  CodeGradX._str2Date(jsjob.marking.$.finished)
              });
              if ( jsjob.$.problem ) {
                  job.problem = true;
              }
              job.duration = CodeGradX.computeDuration(
                  job.finished, job.started);
              batch.jobs[job.label] = job;
              return job;
          }
          if ( js.jobStudentReport ) {
              if ( Array.isArray(js.jobStudentReport) ) {
                  js.jobStudentReport.forEach(processJob);
              } else {
                  processJob(js.jobStudentReport);
              }
          }
          return Promise.resolve(batch);
      }
      batch.XMLreport = response.entity;
      return CodeGradX.parsexml(response.entity)
          .then(processJS)
          .catch(function (reason) {
              /* eslint "no-console": 0 */
              console.log(reason);
              console.log(response);
              return Promise.reject(reason);
          });
  }
  return state.sendRepeatedlyESServer('s', parameters, {
    path: path,
    method: 'GET',
    headers: {
      "Accept": "application/json"
    }
  }).then(processResponse);
};
CodeGradX.Batch.prototype.getReport.default = {
  step: 5, // seconds
  attempts: 100,
  progress: function (/*parameters*/) {}
};

/** Get the final state of the Batch report where all
    answers are marked. This method will update the `finishedjobs`
    and `jobs` fields.

  @param {Object} parameters - parameters {@see sendRepeatedlyESServer}
  @returns {Promise<Batch>} yielding Batch

  */

CodeGradX.Batch.prototype.getFinalReport = function (parameters) {
  const batch = this;
  const state = CodeGradX.getCurrentState();
  state.debug('getBatchFinalReport1', batch);
  if ( batch.finishedjobs &&
       batch.finishedjobs === batch.totaljobs ) {
      // Only return a complete report
      return Promise.resolve(batch);
  }
  parameters = Object.assign({
      // So progress() may look at the current version of the batch report:
      batch: batch
    },
    CodeGradX.Batch.prototype.getReport.default,
    parameters);
  if ( parameters.step < CodeGradX.Batch.prototype.getReport.default.step ) {
      parameters.step = CodeGradX.Batch.prototype.getReport.default.step;
  }
  function tryFetching () {
    state.debug('getBatchFinalReport3', parameters);
    // Get at least one report to access finishedjobs and totaljobs:
    return batch.getReport(parameters).then(fetchAgainReport);
  }
  function fetchAgainReport () {
    state.debug('getBatchFinalReport2', batch);
    if ( batch.finishedjobs < batch.totaljobs ) {
      const dt = parameters.step * 1000; // seconds
      return Promise.resolve(batch).delay(dt).then(tryFetching);
    } else {
      return Promise.resolve(batch);
    }
  }
  return tryFetching();
};

CodeGradX.Batch.prototype.getReportURL = function () {
    const batch = this;
    if ( ! batch.pathdir ) {
        batch.pathdir = '/b' +
            batch.batchid.replace(/-/g, '').replace(/(.)/g, "/$1");
    }
    const path = batch.pathdir + '/' + batch.batchid + '.xml';
    return path;
};

// end of batch.mjs
