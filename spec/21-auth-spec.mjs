// Jasmine tests for public interactions

import CodeGradX from '../codegradx.mjs';
import authData from './auth1-data.mjs';     // lambda student

describe('CodeGradX 21', function () {

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
            agent.state.debug(reason).show();
            //console.log(reason);
            fail(reason);
            done();
        };
    }

  it("cannot authenticate with wrong password", async function (done) {
      var state = await CodeGradX.initialize();
      state.servers = otherServers;
      var faildone = make_faildone(done);
      state.getAuthenticatedUser('nobody:0', 'totallyWrong').then(
          function (user) {
              console.log(user);
              faildone();
          }, function (reason) {
              expect(reason).toBeDefined();
              done();
          });
  }, 10*1000);

});
