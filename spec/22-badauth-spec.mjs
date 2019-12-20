// Jasmine test checking bad authentications

import CodeGradX from '../codegradx.mjs';

describe('CodeGradX 22 bad authentication', function () {
    
    function make_faildone (done) {
        return function faildone (reason) {
            var state = CodeGradX.getCurrentState();
            state.debug('faildone', reason).show();
            //console.log(reason);
            fail(reason);
            done();
        };
    }

    it('missing username', async function (done) {
        var state = await CodeGradX.initialize();
        var faildone = make_faildone(done);
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
    }, 10*1000);

    it('missing password', async function (done) {
        var state = await CodeGradX.initialize();
        var faildone = make_faildone(done);
        state.getAuthenticatedUser('schmilblick', '')
            .then(function (user) {
                faildone();
            })
            .catch(function (reason) {
                //console.log(reason);
                expect(reason.reason).toMatch(/e151/);
                done();
            });
    }, 10*1000);

    it('bad username', async function (done) {
        var state = await CodeGradX.initialize();
        var faildone = make_faildone(done);
        state.getAuthenticatedUser('schmilblick', 'nop')
            .then(function (user) {
                faildone();
            })
            .catch(function (reason) {
                //console.log(reason);
                expect(reason.reason).toMatch(/e162/);
                done();
            });
    }, 10*1000);

    it('bad password', async function (done) {
        var state = await CodeGradX.initialize();
        var faildone = make_faildone(done);
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
    }, 10*1000);

});
