// Jasmine test to check progress
// requires file ./auth-data.json with login and password (not under git!)

import { CodeGradX } from '../src/campaign.mjs';

import authData from './auth1-data.mjs';     // lambda student
import _1 from '../src/campaignlib.mjs';
import _2 from '../src/exercise.mjs';
import _3 from '../src/exercisesSet.mjs';
import _4 from '../src/job.mjs';
import { xml2html } from '../src/xml2html.mjs';
import { parsexml } from '../src/parsexml.mjs';
import _7 from '../src/userlib.mjs';

describe('CodeGradX 44', function () {

  let otherServers;
  it('should be loaded', function (done) {
      expect(CodeGradX).toBeDefined();
      CodeGradX.initialize().then((state) => {
          expect(state.servers).toBeDefined();
          // get tests.codegradx.org or localhost.js predefined servers:
          otherServers = state.servers;
          done();
      });
  });

  it('should authenticate', function (done) {
      expect(CodeGradX).toBeDefined();
      function faildone (reason) {
          state.debug(reason).show();
          fail(reason);
          done();
      }
      var state = CodeGradX.getCurrentState();
      state.plugCache('InlineCache');
      state.mkCacheFor('Campaign');
      state.mkCacheFor('Exercise');
      state.mkCacheFor('ExercisesSet');
      state.mkCacheFor('Job');
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
          // user.results are not sorted!
          let result;
          for ( let i=0 ; i<user.results.length ; i++ ) {
              const item = user.results[i];
              if ( item.name === 'com.paracamplus.li362.tr.4' ) {
                  result = item;
                  break;
              }
          }
          if ( result ) {
              expect(result.name).toBe('com.paracamplus.li362.tr.4');
              expect(result.nickname).toBe('deblanchir');
              expect(result.mark).toBe(0.1);
          } else {
              faildone("Could not find deblanchir");
          }
          expect(user.badges.length).toBe(0);
          done();
      }, faildone);
  }, 15*1000); // 15 seconds
    
});
