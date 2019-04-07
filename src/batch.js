// batch.js
// Time-stamp: "2019-04-07 10:30:39 queinnec"

module.exports = function (CodeGradX) {

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
          batch.jobs = {};
          //console.log(js);
          function processJob (jsjob) {
              //console.log(jsjob);
              let job = state.cache.jobs[jsjob.$.jobid];
              if ( ! job ) {
                  job = new CodeGradX.Job({
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
                  job.duration = (job.finished.getTime() - 
                                  job.started.getTime() )/1000; // seconds
                  state.cache.jobs[job.jobid] = job;
              }
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
      "Accept": "text/xml"
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

};

// end of batch.js
