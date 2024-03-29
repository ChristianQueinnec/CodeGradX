// Jasmine test checking bad authentications

import { CodeGradX } from '../codegradx.mjs';

describe('CodeGradX 22 bad authentication', function () {
    
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

    it('missing username', function (done) {
        var faildone = make_faildone(done);
        CodeGradX.initialize().then((state) => {
            state.servers = otherServers;
            state.getAuthenticatedUser('', 'xxx')
                .then(function (user) {
                    faildone();
                })
                .catch(function (reason) {
                    console.log(reason);
                    state.debug().show();
                    expect(reason.kind).toMatch(/errorAnswer/);
                    expect(reason.reason).toMatch(/e150/);
                    done();
                });
        });
    }, 10*1000);

    it('missing password', function (done) {
        var faildone = make_faildone(done);
        CodeGradX.initialize().then((state) => {
            state.servers = otherServers;
            state.getAuthenticatedUser('schmilblick', '')
                .then(function (user) {
                    faildone();
                })
                .catch(function (reason) {
                    //console.log(reason);
                    expect(reason.reason).toMatch(/e151/);
                    done();
                });
        });
    }, 10*1000);

    it('bad username', function (done) {
        var faildone = make_faildone(done);
        CodeGradX.initialize().then((state) => {
            state.servers = otherServers;
            state.getAuthenticatedUser('schmilblick', 'nop')
                .then(function (user) {
                    faildone();
                })
                .catch(function (reason) {
                    //console.log(reason);
                    expect(reason.reason).toMatch(/e162/);
                    done();
                });
        });
    }, 10*1000);

    it('bad password', function (done) {
        var faildone = make_faildone(done);
        CodeGradX.initialize().then((state) => {
            state.servers = otherServers;
            state.getAuthenticatedUser('nobody:0', 'nop')
                .then(function (user) {
                    faildone();
                })
                .catch(function (reason) {
                    //console.log(reason);
                    //state.log.show();
                    expect(reason.reason).toMatch(/e162/);
                    done();
                });
        });
    }, 10*1000);

});
