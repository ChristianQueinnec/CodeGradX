// job.js
// Time-stamp: "2019-04-07 10:20:35 queinnec"

module.exports = function (CodeGradX) {
    const when = CodeGradX.when;

/** Get the marking report of that Job. The marking report will be stored
    in the `XMLreport` and `report` properties.

  @param {Object} parameters - for repetition see sendRepeatedlyESServer.default
  @returns {Promise} yields {Job}

  */

CodeGradX.Job.prototype.getReport = function (parameters) {
  parameters = parameters || {};
  const job = this;
  const state = CodeGradX.getCurrentState();
  state.debug('getJobReport1', job);
  if ( job.XMLreport ) {
    return Promise.resolve(job);
  }
  const path = job.getReportURL();
  const promise = state.sendRepeatedlyESServer('s', parameters, {
    path: path,
    method: 'GET',
    headers: {
      "Accept": "text/xml"
    }
  });
  const promise1 = promise.then(function (response) {
    //state.log.show();
    //console.log(response);
    state.debug('getJobReport2', job);
    job.originServer = response.url.replace(/^(.*)\/s\/.*$/, "$1");
    job.XMLreport = response.entity;
    return Promise.resolve(job);
  }).catch(function (reasons) {
      // sort reasons and extract only waitedTooMuch if present:
      function tooLongWaiting (reasons) {
          if ( Array.isArray(reasons) ) {
              for ( let i = 0 ; i<reasons.length ; i++ ) {
                  const r = reasons[i];
                  const result = tooLongWaiting(r);
                  if ( result ) {
                      return result;
                  }
              }
          } else if ( reasons instanceof Error ) {
              if ( reasons.message.match(/waitedTooMuch/) ) {
                  return reasons;
              }
          }
          return undefined;
      }
      const result = tooLongWaiting(reasons);
      return Promise.reject(result || reasons);
  });
  const promise2 = promise.then(function (response) {
    // Fill archived, started, ended, finished, mark and totalMark
    state.debug('getJobReport3', job);
    /* eslint no-control-regex: "off" */
    const markingRegExp = new RegExp("^(.|\n)*(<marking (.|\n)*?>)(.|\n)*$");
    let marking = response.entity.replace(markingRegExp, "$2");
    state.debug('getJobReport3 marking', marking);
    //console.log(marking); //DEBUG
    if ( marking.length === response.entity.length ) {
        return Promise.reject(response);
    }
    marking = marking.replace(/>/, "/>");
    //console.log(marking);
    return CodeGradX.parsexml(marking).then(function (js) {
      job.mark = CodeGradX._str2num2decimals(js.marking.$.mark);
      job.totalMark = CodeGradX._str2num2decimals(js.marking.$.totalMark);
      job.archived  = CodeGradX._str2Date(js.marking.$.archived);
      job.started   = CodeGradX._str2Date(js.marking.$.started);
      job.ended     = CodeGradX._str2Date(js.marking.$.ended);
      job.finished  = CodeGradX._str2Date(js.marking.$.finished);
      // machine, partial marks TO BE DONE
      return Promise.resolve(response);
    });
  });
  const promise3 = promise.then(function (response) {
    // Fill exerciseid (already in exercise.uuid !)
    state.debug('getJobReport4', job);
    const exerciseRegExp = new RegExp("^(.|\n)*(<exercise (.|\n)*?>)(.|\n)*$");
    const exercise = response.entity.replace(exerciseRegExp, "$2");
    if ( exercise.length === response.entity.length ) {
        return Promise.reject(response);
    }
    //console.log(exercise);
    return CodeGradX.parsexml(exercise).then(function (js) {
      Object.assign(job, js.exercise.$);
      return Promise.resolve(response);
    });
  });
  const promise4 = promise.then(function (response) {
    // Fill report
    state.debug('getJobReport5');
    const contentRegExp = new RegExp("^(.|\n)*(<report>(.|\n)*?</report>)(.|\n)*$");
    const content = response.entity.replace(contentRegExp, "$2");
    //state.debug('getJobReport5 content',
    //         content.length, response.entity.length);
    if ( content.length === response.entity.length ) {
        return Promise.reject(response);
    }
    job.HTMLreport = CodeGradX.xml2html(content);
    return Promise.resolve(response);
  });
  return when.join(promise2, promise3, promise4).then(function (/*values*/) {
    state.debug('getJobReport6', job);
    //console.log(job);
    return promise1;
  }).finally(function () {
      return promise1;
  });
};

/** Get the problem report of that Job if it exists. The marking
    report will be stored in the `XMLproblemReport` property. If no
    problem report exists, the returned promise is rejected.

  @param {Object} parameters - for repetition see sendRepeatedlyESServer.default
  @returns {Promise} yields {Job}

  */

CodeGradX.Job.prototype.getProblemReport = function (parameters) {
    parameters = parameters || {};
    const job = this;
    const state = CodeGradX.getCurrentState();
    state.debug('getJobProblemReport1', job);
    if ( ! job.problem ) {
        return Promise.reject("No problem report");
    }
    if ( job.XMLproblemReport ) {
        return Promise.resolve(job);
    }
    const path = job.getProblemReportURL();
    const promise = state.sendRepeatedlyESServer('s', parameters, {
        path: path,
        method: 'GET',
        headers: {
            "Accept": "text/xml"
        }
    });
    const promise1 = promise.then(function (response) {
        //state.log.show();
        //console.log(response);
        state.debug('getJobProblemReport2', job);
        job.originServer = response.url.replace(/^(.*)\/s\/.*$/, "$1");
        job.XMLproblemReport = response.entity;
        return Promise.resolve(job);
    });
    return promise1;
};

/** Compute the URL that form the base URL to access directly the
    report, the problem report or the archive containing student's
    programs.
  
    @returns {string} url

*/

CodeGradX.Job.prototype.getBaseURL = function () {
    const job = this;
    const path = job.pathdir + '/' + job.jobid;
    return path;
};
CodeGradX.Job.prototype.getReportURL = function () {
    const job = this;
    return job.getBaseURL() + '.xml';
};
CodeGradX.Job.prototype.getProblemReportURL = function () {
    const job = this;
    return job.getBaseURL() + '_.xml';
};
CodeGradX.Job.prototype.getTgzURL = function () {
    const job = this;
    return job.getBaseURL() + '.tgz';
};

};

// end of job.js
