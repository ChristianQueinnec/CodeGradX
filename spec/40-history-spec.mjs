// Jasmine test to check history
// requires file ./auth-data.json with login and password (not under git!)

import CodeGradX from '../src/campaign.mjs';
import authData from './auth1-data.mjs';     // lambda student
import _1 from '../src/campaignlib.mjs';
import _2 from '../src/exercise.mjs';
import _3 from '../src/exercisesSet.mjs';
import _4 from '../src/job.mjs';
import { xml2html } from '../src/xml2html.mjs';
import { parsexml } from '../src/parsexml.mjs';

describe('CodeGradX 40 history', function () {

  it('should be loaded', async function (done) {
    expect(CodeGradX).toBeDefined();
    var state = await CodeGradX.initialize();
    function faildone (reason) {
      state.debug(reason).show();
      fail(reason);
      done();
    }
    state.getAuthenticatedUser(authData.login, authData.password)
    .then(function (user) {
      expect(user).toBeDefined();
      expect(user).toBe(state.currentUser);
      done();
    }, faildone);
  });

  var campaign0;

  it("should get campaign free", function (done) {
    var state = CodeGradX.getCurrentState();
    function faildone (reason) {
      state.debug(reason).show();
      fail(reason);
      done();
    }
    expect(state.currentUser instanceof CodeGradX.User).toBeTruthy();
    state.currentUser.getCampaign('free').then(function (campaign) {
        expect(campaign instanceof CodeGradX.Campaign).toBeTruthy();
        expect(campaign).toBeDefined();
        expect(campaign.name).toBe('free');
        //console.log(campaign);
        campaign0 = campaign;
        campaign.getExercisesSet().then(function (es) {
            expect(es instanceof CodeGradX.ExercisesSet).toBeTruthy();
            expect(es).toBeDefined();
            expect(es).toBe(campaign.exercisesSet);
            done();
        }, faildone);
    }, faildone);
  });

  it("should get history", function (done) {
    var state = CodeGradX.getCurrentState();
    function faildone (reason) {
      state.debug(reason).show();
      fail(reason);
      done();
    }
    expect(campaign0 instanceof CodeGradX.Campaign).toBeTruthy();
    expect(campaign0).toBeDefined();
    campaign0.getJobs().then(function (jobs) {
      //console.log(jobs);
      expect(jobs.length).toBeGreaterThan(2);
      done();
    }, faildone);
  }, 10*1000); // 10 seconds

  it("should get skills", function (done) {
    var state = CodeGradX.getCurrentState();
    function faildone (reason) {
      state.debug(reason).show();
      fail(reason);
      done();
    }
    expect(campaign0 instanceof CodeGradX.Campaign).toBeTruthy();
    campaign0.getSkills().then(function (js) {
      //console.log(js);
      expect(js).toBeDefined();
      expect(js.you).toBeDefined();
      expect(js.you.skill).toBeDefined();
        // Bad tests since these figures may evolve!
      expect(js.you.personId).toBe(45);
      expect(typeof js.others).toBe('object');
      expect(js.others).toBeDefined();
      expect(js.others[1]).toBe(5); //may evolve!
      expect(js.others[2]).toBe(5); //may evolve!
      done();
    }, faildone);
  }, 30*1000); // 15 seconds

});
