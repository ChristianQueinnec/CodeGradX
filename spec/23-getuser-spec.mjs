// Jasmine test. Get current user

import CodeGradX from '../codegradx.mjs';
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

    it("really authenticate and check", async function (done) {
        var state = await CodeGradX.initialize();
        state.servers = otherServers;
        var faildone = make_faildone(done);
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

    it("really authenticate and re-check", async function (done) {
        var state = await CodeGradX.initialize();
        state.servers = otherServers;
        var faildone = make_faildone(done);
        state.getAuthenticatedUser(authData.login, authData.password)
            .then(function (user) {
                expect(user).toBeDefined();
                expect(user).toBe(state.currentUser);
                state.currentUser = null; // erase currentUser
                CodeGradX.getCurrentUser()
                .then(function (user2) {
                    expect(user2.personid).toBe(user.personid);
                    expect(user2).toBe(state.currentUser);
                    done();
                }).catch(faildone);
            }, faildone);
    });

});


    
