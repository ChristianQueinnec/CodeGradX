// Jasmine test. Get current user

import { CodeGradX } from '../src/cache.mjs';

import authData from './auth1-data.mjs';     // lambda student

describe('CodeGradX 23', function () {

    it('should be loaded', function () {
        expect(CodeGradX).toBeDefined();
    });
    
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
            state.plugCache('InlineCache');
            state.servers = otherServers;
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

    it("really authenticate and re-check", function (done) {
        var faildone = make_faildone(done);
        CodeGradX.initialize().then((state) => {
            state.plugCache('InlineCache');
            state.mkCacheFor('Campaign');
            state.servers = otherServers;
            state.getAuthenticatedUser(authData.login, authData.password)
                .then(function (user) {
                    expect(user).toBeDefined();
                    expect(user).toBe(state.currentUser);
                    state.currentUser = null; // erase currentUser
                    CodeGradX.getCurrentUser()
                        .then(function (user2) {
                            expect(user2).toBeDefined();
                            expect(user2.personid).toBe(user.personid);
                            expect(user2).toBe(state.currentUser);
                            done();
                        }).catch(faildone);
                }, faildone);
        });
    });

});


    
