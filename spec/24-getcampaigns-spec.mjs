// Jasmine test. load a sub library

import { CodeGradX } from '../src/campaign.mjs';

import authData from './auth1-data.mjs';     // lambda student

describe('CodeGradX 24', function () {

  let otherServers;
  it('should be loaded', function (done) {
      expect(CodeGradX).toBeDefined();
      CodeGradX.initialize().then((state) => {
          expect(state.servers).toBeDefined();
          otherServers = state.servers;
          done();
      });
  });
    
    function make_faildone (done) {
        return function faildone (reason) {
            var state = CodeGradX.getCurrentState();
            state.debug('faildone', reason).show();
            //console.log(reason);
            fail(reason);
            done();
        };
    }

    it("really authenticate and check", function (done) {
        var faildone = make_faildone(done);
        CodeGradX.initialize().then((state) => {
            state.servers = otherServers;
            state.plugCache('InlineCache');
            state.mkCacheFor('Campaign');
            state.getAuthenticatedUser(authData.login, authData.password)
                .then(function (user) {
                    expect(user).toBeDefined();
                    expect(user).toBe(state.currentUser);
                    CodeGradX.getCurrentUser()
                        .then(function (user2) {
                            expect(user2).toBe(user);
                            done();
                        }).catch(faildone);
                }, faildone);
        });
    });

    function hash2array (o) {
        let result = [];
        Object.keys(o).forEach((key) => {
            result.push(o[key]);
        });
        return result;
    }
    
    it("get campaigns", function (done) {
        var faildone = make_faildone(done);
        CodeGradX.getCurrentUser()
            .then(function (user) {
                return user.getCampaigns()
                    .then(function (campaigns) {
                        //console.log(campaigns);
                        expect(campaigns).toBeDefined();
                        expect(campaigns instanceof Object).toBeTruthy();
                        expect(campaigns.checks).toBeDefined();
                        expect(campaigns.free).toBeDefined();
                        expect(hash2array(campaigns).length).toBeGreaterThan(2);
                        done();
                    });
            }).catch(faildone);
    });

    it("get a specific campaign (after campaigns)", function (done) {
        var faildone = make_faildone(done);
        CodeGradX.getCurrentUser()
            .then(function (user) {
                return user.getCampaign('free')
                    .then(function (campaign) {
                        //console.log(campaigns);
                        expect(campaign).toBeDefined();
                        expect(campaign instanceof Object).toBeTruthy();
                        expect(campaign.name).toBe('free');
                        done();
                    });
            }).catch(faildone);
    });

    it("get a specific campaign (without previous getCampaigns)",
       function (done) {
           var faildone = make_faildone(done);
           CodeGradX.initialize().then((state) => {
               state.servers = otherServers;
               state.getAuthenticatedUser(authData.login, authData.password)
                   .then(function (user) {
                       user.getCampaign('free')
                           .then(function (campaign) {
                               //console.log(campaigns);
                               expect(campaign).toBeDefined();
                               expect(campaign instanceof Object).toBeTruthy();
                               expect(campaign.name).toBe('free');
                               done();
                           });
                   }).catch(faildone);
           });
       });

});
