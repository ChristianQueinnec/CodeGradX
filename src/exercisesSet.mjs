// exercisesSet.js
// Time-stamp: "2021-02-24 10:38:16 queinnec"

import CodeGradX from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export default CodeGradX;

/** Keep only persistable values and convert then into JSON */

CodeGradX.ExercisesSet.prototype.jsonize = function () {
    const exercisesset = this;
    return JSON.stringify(exercisesset);
};

/** Find an exercise by its name in an ExercisesSet that is,
    a tree of Exercises.

    @param {String|Number} name
    @returns {Exercise}

  */

CodeGradX.ExercisesSet.prototype.getExercise = function (name) {
  const exercises = this;
  if ( Number.isFinite(name) ) {
      return exercises.getExerciseByIndex(name);
  } else {
      return exercises.getExerciseByName(name);
  }
};

CodeGradX.ExercisesSet.prototype.getExerciseByName = function (name) {
  const exercisesSet = this;
  //console.log(exercisesSet);// DEBUG
  function find (thing) {
    if ( thing instanceof CodeGradX.ExercisesSet ) {
      const exercises = thing.exercises;
      for ( let i=0 ; i<exercises.length ; i++ ) {
        //console.log("explore " + i + '/' + exercises.length);
        const result = find(exercises[i]);
        if ( result ) {
          return result;
        }
      }
      return false;
    } else if ( thing instanceof CodeGradX.Exercise ) {
      const exercise = thing;
      //console.log("compare with " + exercise.name);
      if ( exercise.name === name ) {
        return exercise;
      } else {
        return false;
      }
    } else {
        throw new Error("Not an Exercise nor an ExerciseSet", thing);
    }
  }
  return find(exercisesSet);
};

CodeGradX.ExercisesSet.prototype.getExerciseByIndex = function (index) {
  const exercises = this;
  function find (exercises) {
    if ( Array.isArray(exercises) ) {
      for ( let i=0 ; i<exercises.length ; i++ ) {
        //console.log("explore " + i); // DEBUG
        const result = find(exercises[i]);
        if ( result ) {
          return result;
        }
      }
      return false;
    } else if ( exercises instanceof CodeGradX.ExercisesSet ) {
      return find(exercises.exercises);
    } else if ( exercises instanceof CodeGradX.Exercise ) {
      if ( index === 0 ) {
        return exercises;
      } else {
        //console.log('index= ' + index); // DEBUG
        index--;
        return false;
      }
    }
  }
  return find(exercises);
};

// end of exercisesSet.js
