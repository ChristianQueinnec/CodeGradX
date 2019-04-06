// userlib.js
// Time-stamp: "2019-04-06 17:03:31 queinnec"

module.exports = function (CodeGradX) {
    const _ = CodeGradX._;

/** Fetch all the jobs submitted by the user (independently of the
    current campaign).

        @returns {Promise<Jobs>} yields {Array[Job]}

 */

CodeGradX.User.prototype.getAllJobs = function () {
    const state = CodeGradX.getCurrentState();
    const user = this;
    state.debug('getAllJobs1', user);
    return state.sendAXServer('x', {
        path:   '/history/jobs',
        method: 'GET',
        headers: {
            Accept: "application/json"
        }
    }).then(function (response) {
        state.debug('getAllJobs2');
        //console.log(response);
        state.jobs = _.map(response.entity.jobs, CodeGradX.Job.js2job);
        return Promise.resolve(state.jobs);
    });
};

/** Fetch all exercises submitted by the user (independently of the
    current campaign) but only the exercices created after the
    starttime of the current campaign.

        @returns {Promise<Exercises>} yields {Array[Exercise]}

 */

CodeGradX.User.prototype.getAllExercises = function () {
    const state = CodeGradX.getCurrentState();
    const user = this;
    state.debug('getAllExercises1', user);
    return CodeGradX.getCurrentUser()
        .then(function (user) {
            return user.getCurrentCampaign();
        }).then(function (campaign) {
            FW4EX.fillCampaignCharacteristics(campaign);
            let url = `/exercises/person/${user.personid}`;
            let d = campaign.starttime.toISOString().replace(/T.*$/, '');
            url += `?after=${encodeURI(d)}`;
            return state.sendAXServer('x', {
                path: url,
                method: 'GET',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            });
        }).then(function (response) {
            state.debug('getAllExercises2');
            //console.log(response);
            state.exercises = _.map(response.entity.exercises,
                                    CodeGradX.Exercise.js2exercise);
            return Promise.resolve(state.exercises);
        });
};

/** get the list of exercises a user tried in a given campaign, get
    also the list of badges (or certificates) won during that
    campaign. It enriches the current user with new properties
    results and badges.

    @param {Campaign} campaign - Campaign
    @return {Promise<User>} yielding the User 
    @property {array[string]} user.badges - urls of badges
    @property {number} user.results[].mark - gotten mark
    @property {string} user.results[].name - exercise long name
    @property {string} user.results[].nickname - exercise nickname

 */

CodeGradX.User.prototype.getProgress = function (campaign) {
    const state = CodeGradX.getCurrentState();
    const user = this;
    state.debug('getProgress1', user);
    return state.sendAXServer('x', {
        path:   ('/skill/progress/' + campaign.name),
        method: 'GET',
        headers: {
            Accept: "application/json"
        }
    }).then(function (response) {
        state.debug('getProgress2', response);
        //console.log(response);
        user.results = response.entity.results;
        user.badges = response.entity.badges;
        return Promise.resolve(user);
    });
};

};

// end of userlib.js
