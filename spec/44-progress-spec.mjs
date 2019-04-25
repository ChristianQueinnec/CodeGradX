// Jasmine test to check progress
// requires file ./auth-data.json with login and password (not under git!)

import CodeGradX from '../src/campaign.mjs';
import authData from './auth1-data.mjs';     // lambda student
import _1 from '../src/campaignlib.mjs';
import _2 from '../src/exercise.mjs';
import _3 from '../src/exercisesSet.mjs';
import _4 from '../src/job.mjs';
import _5 from '../src/xml2html.mjs';
import _6 from '../src/parsexml.mjs';
import _7 from '../src/userlib.mjs';

describe('CodeGradX', function () {

  it('should be loaded', function (done) {
    expect(CodeGradX).toBeDefined();
    var state = new CodeGradX.State();
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
        //console.log(campaign);//DEBUG
        campaign0 = campaign;
        campaign.getExercisesSet().then(function (es) {
          expect(es instanceof CodeGradX.ExercisesSet).toBeTruthy();
          expect(es).toBe(campaign.exercisesSet);
          done();
        }, faildone);
    }, faildone);
  });

  it("should get progress", function (done) {
      var state = CodeGradX.getCurrentState();
      function faildone (reason) {
          state.debug(reason).show();
          fail(reason);
          done();
      }
      expect(state.currentUser instanceof CodeGradX.User).toBeTruthy();
      state.currentUser.getProgress(campaign0).then(function (user) {
          expect(user.results.length).toBeGreaterThan(0);
          console.log(user.results);//DEBUG
          expect(user.results[0].name).toBe('com.paracamplus.li205.function.1');
          expect(user.results[0].nickname).toBe('min');
          expect(user.results[0].mark).toBe(1);
          expect(user.badges.length).toBe(0);
          done();
      }, faildone);
  }, 10*1000); // 10 seconds
    
});
