// campaignlib.mjs
// Time-stamp: "2021-09-14 18:03:46 queinnec"

import { CodeGradX as cx } from './exercisesSet.mjs';
/** Re-export the `CodeGradX` object */
export const CodeGradX = cx;
export default CodeGradX;

/** Get the (tree-shaped) set of exercises of a campaign. This
    mechanism is used to get an updated list of exercises. First, look
    in an X server then on the site associated to the campaign.

      @return {Promise} yields {ExercisesSet}

    */

CodeGradX.Campaign.prototype.getExercisesSet = function () {
    const state = CodeGradX.getCurrentState();
    const campaign = this;
    state.debug('getExercisesSet1', campaign);
    if ( campaign.exercisesSet ) {
        return Promise.resolve(campaign.exercisesSet);
    }
    let cachedexercisesset = state.cachedExercisesSet(campaign.exercisesname);
    if ( cachedexercisesset ) {
        state.debug('getExercisesSet1b from cache', cachedexercisesset);
        campaign.exercisesSet = new CodeGradX.ExercisesSet(cachedexercisesset);
        return Promise.resolve(campaign.exercisesSet);
    }
    function processResponse (response) {
        state.debug('getExercisesSet1', response);
        campaign.exercisesSet = new CodeGradX.ExercisesSet(response.entity);
        state.cachedExercisesSet(campaign.exercisesname,
                                 campaign.exercisesSet );
        return Promise.resolve(campaign.exercisesSet);
    }
    
    return state.sendConcurrently('x', {
        path: ('/exercisesset/path/' + campaign.exercisesname),
        method: 'GET',
        headers: {
            Accept: "application/json"
        }
    })
        .then(processResponse)
        .catch(function (reason) {
            try {
                state.debug("getExercisesSet2Error", reason);
                const request1 = {
                    method: 'GET',
                    path: campaign.home_url + "/exercises.json",
                    headers: {
                        Accept: "application/json"
                    }
                };
                return state.userAgent(request1)
                    .then(processResponse);
            } catch (e) {
                // Probably: bad host name!
                state.debug("getExercisesSet3Error", e);
            }
        });
};

/** Get a specific Exercise with its name within the tree of
    Exercises of the current campaign.

        @param {string} name - full name of the exercise
        @returns {Promise} yields {Exercise}

    */

CodeGradX.Campaign.prototype.getExercise = function (name) {
  const state = CodeGradX.getCurrentState();
  state.debug('getExercise', name);
  const campaign = this;
  return campaign.getExercisesSet().then(function (exercisesSet) {
    const exercise = exercisesSet.getExercise(name);
    if ( exercise ) {
      return Promise.resolve(exercise);
    } else {
      return Promise.reject(new Error("No such exercise " + name));
    }
  });
};

/** Get the list of all exercises available in the current campaign.
    The user must be a teacher of the campaign!
    
    @return {Promise<Array[Object]>} - yield an array of exercises
    @property {string} exercise.nickname
    @property {string} exercise.name
    @property {string} exercise.UUID
    @property {date}   exercise.start

 */

CodeGradX.Campaign.prototype.getExercises = function (refresh = false) {
  const state = CodeGradX.getCurrentState();
  const campaign = this;
  state.debug('getExercises1', campaign);
  if ( ! refresh && campaign.exercises ) {
      return Promise.resolve(campaign.exercises);
  }
  return state.sendAXServer('x', {
    path: ('/campaign/listExercises/' + campaign.name),      
    method: 'GET',
    headers: {
      Accept: "application/json"
    }
  }).then(function (response) {
    state.debug('getExercises2');
    //console.log(response);
    campaign.exercises = response.entity.exercises.map(function (exercise) {
        let cachedexercise = state.cachedExercise(exercise.name);
        if ( cachedexercise ) {
            return new CodeGradX.Exercise(cachedexercise);
        } else {
            return new CodeGradX.Exercise(exercise);
        }
    });
    return Promise.resolve(campaign.exercises);
  });
};

/** Get the list of all batches related to a campaign.

    @return {Promise<Array[Object]>} - yield an array of batches
    @property {string}       batch.uuid
    @property {Exercise}     batch.exercise_uuid
    @property {Person}       batch.person_id
    @property {string}       batch.label
    @property {Date}         batch.start
    @property {Date}         batch.archived
    @property {Date}         batch.finished

 */

CodeGradX.Campaign.prototype.getBatches = function (refresh = false) {
  const state = CodeGradX.getCurrentState();
  const campaign = this;
  state.debug('getBatches1', campaign);
  if ( ! refresh && campaign.batches ) {
      return Promise.resolve(campaign.batches);
  }
  return state.sendAXServer('x', {
    path: ('/campaign/listBatches/' + campaign.name),      
    method: 'GET',
    headers: {
      Accept: "application/json"
    }
  }).then(function (response) {
    state.debug('getBatches2');
    //console.log(response);
    campaign.batches = response.entity.batches.map(function (batch) {
        batch = new CodeGradX.Batch(batch);
        return batch;
    });
    return Promise.resolve(campaign.batches);
  });
};
CodeGradX.Campaign.prototype.getBatchs =
    CodeGradX.Campaign.prototype.getBatches;


/** Get the skills of the students enrolled in the current campaign.

    @return {Promise} yields {Object}
    @property {Object} skills.you
    @property {number} skills.you.personId - your numeric identifier
    @property {number} skills.you.skill - your own skill
    @property {Array<skill>} skills.all - array of Object
    @property {Object} skills.all[].skill - some student's skill

    */

CodeGradX.Campaign.prototype.getSkills = function (refresh = false) {
  const state = CodeGradX.getCurrentState();
  const campaign = this;
  state.debug('getSkills1', campaign);
  if ( ! refresh && campaign.skills ) {
      return Promise.resolve(campaign.skills);
  }
  return state.sendAXServer('x', {
    //path: ('/skill/campaign/' + campaign.name),
    path: ('/statistics/myPosition/' + campaign.name),      
    method: 'GET',
    headers: {
      Accept: "application/json"
    }
  }).then(function (response) {
    state.debug('getSkills2');
    //console.log(response);
    campaign.skills = response.entity;
    return Promise.resolve(campaign.skills);
  });
};

/** list the jobs submitted by the current user in the current campaign.

      @returns {Promise} yields Array[Job]
    */

CodeGradX.Campaign.prototype.getJobs = function () {
  const state = CodeGradX.getCurrentState();
  const campaign = this;
  state.debug('getJobs1', campaign, state.currentUser);
  return state.sendAXServer('x', {
    path: ('/history/campaign/' + campaign.name),
    method: 'GET',
    headers: {
      Accept: "application/json"
    }
  }).then(function (response) {
    state.debug('getJobs2');
    //console.log(response);
    //state.jobs = _.map(response.entity.jobs, CodeGradX.Job.js2job);
    state.jobs = response.entity.jobs.map(CodeGradX.Job.js2job);
    return Promise.resolve(state.jobs);
  });
};

/** Get the jobs submitted by a student in the current campaign.
    This is restricted to admins or teachers of the campaign.
    
    @returns {Promise} yields Array[Job]
*/

CodeGradX.Campaign.prototype.getCampaignStudentJobs = function (user) {
  const state = CodeGradX.getCurrentState();
  const campaign = this;
  state.debug('getAchievements1', campaign, user);
  return state.sendAXServer('x', {
    path: ('/history/campaignJobs/' + campaign.name + '/' + user.personid),
    method: 'GET',
    headers: {
      Accept: "application/json"
    }
  }).then(function (response) {
    state.debug('getAchievements2');
    //console.log(response);
    //user.jobs = _.map(response.entity.jobs, CodeGradX.Job.js2job);
    user.jobs = response.entity.jobs.map(CodeGradX.Job.js2job);
    return Promise.resolve(user.jobs);
  });
};

/** Get the open campaigns ie the campaigns that may be freely joined.
 */

CodeGradX.getOpenCampaigns = function () {
    const state = CodeGradX.getCurrentState();
    state.debug('getOpenCampaigns');
    return state.sendAXServer('x', {
        path: '/campaigns/open',
        method: 'GET',
        headers: {
            Accept: "application/json"
        }
    }).then(function (response) {
        state.debug('getOpenCampaigns2', response);
        let campaigns = response.entity.campaigns.map((js) =>
                new CodeGradX.Campaign(js));
        return Promise.resolve(campaigns);
    });
};

// end of campaignlib.mjs
