// Tests of when.timeout

const CodeGradX = require('../index.js');
const when = CodeGradX.when;

function delayedSuccess (delay, value) {
    //console.log(`creating ${promise} and ${delay}`);
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve(value);
        }, delay);
    });
}

function delayedRejection (delay, value) {
    //console.log(`creating ${promise} and ${delay}`);
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            reject(value);
        }, delay);
    });
}

describe("when.timeout", function () {
    
    function make_faildone (done) {
        return function faildone (reason) {
            //console.log(reason);
            fail(reason);
            done();
        };
    }

    it("immediate", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.timeout(Promise.resolve(11), 1000)
            .then((value) => {
                expect(value).toBe(11);
                expect(Date.now() - t0).toBeLessThan(100);
                done();
            }).catch(faildone);
    });

    it("short success", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.timeout(delayedSuccess(100, 21), 1000)
            .then((value) => {
                expect(value).toBe(21);
                expect(Date.now() - t0).toBeLessThan(200);
                done();
            }).catch(faildone);
    });

    it("short failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.timeout(delayedRejection(100, 31), 1000)
            .then(faildone)
            .catch((reason) => {
                expect(reason).toBe(31);
                expect(Date.now() - t0).toBeLessThan(200);
                done();
            });
    });

    it("timeout failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.timeout(delayedSuccess(1000, 41), 100)
            .then(faildone)
            .catch((reason) => {
                expect(reason).toMatch(/Duration 100 exhausted/);
                expect(Date.now() - t0).toBeGreaterThan(99);
                expect(Date.now() - t0).toBeLessThan(1000);
                done();
            });
    });

});

// end of 011-when.timeout-spec.js
