// job.js
// Time-stamp: "2021-09-14 18:04:16 queinnec"

import { CodeGradX as cx } from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export const CodeGradX = cx;
export default CodeGradX;

import { parsexml } from './parsexml.mjs';
import { xml2html } from './xml2html.mjs';

/** Keep only persistable values and convert then into JSON */

CodeGradX.Job.prototype.jsonize = function () {
    const job = this;
    const keys = [
        'XMLreport',
        'mark',
        'totalMark',
        'archived',
        'started',
        'ended',
        'finished',
        'exerciseid',
        'safecookie',
        'name',
        'nickname',
        'totalMark',
        'HTMLreport',
        'originServer'
    ];
    return CodeGradX.jsonize(job, keys);
};

/** Get the marking report of that Job. The marking report will be stored
    in the `XMLreport` and `HTMLreport` properties.

  @param {Object} parameters - for repetition see sendRepeatedlyESServer.default
  @returns {Promise} yields {Job}

  */

CodeGradX.Job.prototype.getReport = async function (parameters = {}) {
    const job = this;
    const state = CodeGradX.getCurrentState();
    state.debug('getJobReport1', job);
    if ( job.XMLreport ) {
        return Promise.resolve(job);
    }
    let cachedjob = state.cachedJob(job.jobid);
    if ( cachedjob ) {
        state.debug('getJobReport from cache', cachedjob);
        Object.assign(job, cachedjob);
        return Promise.resolve(job);
    }
    const path = job.getReportURL();
    const response = await state.sendRepeatedlyESServer('s', parameters, {
        path: path,
        method: 'GET',
        headers: {
            "Accept": "application/json"
        }
    }).catch(reasons => {
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
    state.debug('getJobReport2', response);
    job.originServer = response.url.replace(/^(.*)\/s\/.*$/, "$1");
    job.XMLreport = response.entity;
    //state.log.show();
    
    /* eslint no-control-regex: 0 */
    const markingRegExp = new RegExp("^(.|\n)*(<marking (.|\n)*?>)(.|\n)*$");
    let marking = response.entity.replace(markingRegExp, "$2");
    state.debug('getJobReport3 marking', marking);
    //console.log(marking); //DEBUG
    if ( marking.length === response.entity.length ) {
        return Promise.reject(response);
    }
    marking = marking.replace(/>/, "/>");
    //console.log(marking);
    let js = await CodeGradX.parsexml(marking);
    job.mark = CodeGradX._str2num2decimals(js.marking.$.mark);
    job.totalMark = CodeGradX._str2num2decimals(js.marking.$.totalMark);
    job.archived  = CodeGradX._str2Date(js.marking.$.archived);
    job.started   = CodeGradX._str2Date(js.marking.$.started);
    job.ended     = CodeGradX._str2Date(js.marking.$.ended);
    job.finished  = CodeGradX._str2Date(js.marking.$.finished);
    // machine, partial marks TO BE DONE
    //state.log.show();

    /* eslint no-control-regex: 0 */
    const exerciseRegExp = new RegExp("^(.|\n)*(<exercise (.|\n)*?>)(.|\n)*$");
    const exercise = response.entity.replace(exerciseRegExp, "$2");
    if ( exercise.length === response.entity.length ) {
        return Promise.reject(response);
    }
    //console.log(exercise);
    js = await CodeGradX.parsexml(exercise);
    Object.assign(job, js.exercise.$);
    //state.log.show();
    
    const contentRegExp = new RegExp("^(.|\n)*(<report>(.|\n)*?</report>)(.|\n)*$");
    const content = response.entity.replace(contentRegExp, "$2");
    //state.debug('getJobReport5 content',
    //         content.length, response.entity.length);
    if ( content.length === response.entity.length ) {
        return Promise.reject(response);
    }
    state.debug('getJobReport5a', 'before xml2html');
    const HTMLreport = await CodeGradX.xml2html(content);
    job.HTMLreport = HTMLreport;
    state.debug('getJobReport5b', 'after xml2html');
    //state.log.show();
    state.cachedJob(job.jobid, job);

    return job;
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
            "Accept": "application/json"
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

// end of job.js
