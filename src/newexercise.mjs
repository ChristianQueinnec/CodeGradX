// userlib.mjs
// Time-stamp: "2021-04-27 20:27:03 queinnec"

import { CodeGradX as _cx } from 'codegradx/campaign';
/** Re-export the `CodeGradX` object */
export const CodeGradX = _cx;
import { parsexml } from 'codegradx/src/parsexml';

/** submit a new Exercise and return it as soon as submitted successfully.
    This variant sends the content of a DOM form.

    @param {DOM} form - a DOM element
    @returns {Promise<Exercise>} yielding Exercise

    */

CodeGradX.User.prototype.submitNewExerciseFromDOM = function (form, filename) {
  const user = this;
  const state = CodeGradX.getCurrentState();
  state.debug('submitNewExerciseFromDOM1', user);
  function processResponse (response) {
      //console.log(response);
      state.debug('submitNewExerciseFromDOM3', response);
      return CodeGradX.parsexml(response.entity).then(function (js) {
        //console.log(js);
        state.debug('submitNewExerciseFromDOM4', js);
        js = js.fw4ex.exerciseSubmittedReport;
        const exercise = new CodeGradX.Exercise({
          location: js.$.location,
          personid: CodeGradX._str2num(js.person.$.personid),
          exerciseid: js.exercise.$.exerciseid,
          XMLsubmission: response.entity
        });
        state.debug('submitNewExerciseFromDOM5', exercise.exerciseid);
        return Promise.resolve(exercise);
      });
  }
  const fd = new FormData(form);
  const basefilename = (filename || FW4EX.currentFileName)
      .replace(new RegExp("^.*/"), '');
  const headers = {
      // Useless since we post a FormData:
      //"Content-Type": "multipart/form-data",
      "Content-Disposition": ("inline; filename=" + basefilename),
      "Accept": 'application/json'
  };
  return state.sendSequentially('e', {
      path: '/exercises/',
      method: "POST",
      headers: headers,
      entity: fd
  }).then(processResponse);
};

/** submit a new Exercise and return it as soon as submitted successfully.
    This variant sends the content as a file.

    @param {ByteString} tgz
    @param {String} filename
    @returns {Promise<Exercise>} yielding Exercise

    */

CodeGradX.User.prototype.submitNewExercise = function (tgz, filename) {
  const user = this;
  const state = CodeGradX.getCurrentState();
    state.debug('submitNewExercise1', user, filename);
  function processResponse (response) {
      //console.log(response);
      state.debug('submitNewExercise3', response);
      return CodeGradX.parsexml(response.entity).then(function (js) {
        //console.log(js);
        state.debug('submitNewExercise4', js);
        js = js.fw4ex.exerciseSubmittedReport;
        const exercise = new CodeGradX.Exercise({
          location: js.$.location,
          personid: CodeGradX._str2num(js.person.$.personid),
          exerciseid: js.exercise.$.exerciseid,
          XMLsubmission: response.entity
        });
        state.debug('submitNewExercise5', exercise.exerciseid);
        return Promise.resolve(exercise);
      });
  }
  const basefilename = filename.replace(new RegExp("^.*/"), '');
  const headers = {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `inline; filename=${basefilename}`,
      "Accept": 'application/json'
  };
  return state.sendSequentially('e', {
      path: '/exercises/',
      method: "POST",
      headers: headers,
      entity: tgz
  }).then(processResponse);
};

// end of newexercise.mjs
