// Tests of when.delay

import CodeGradX from '../codegradx.mjs';
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

describe("when.delay", function () {
    
    function make_faildone (done) {
        return function faildone (reason) {
            console.log(reason);
            fail(reason);
            done();
        };
    }

    it("success delay", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.delay(Promise.resolve(11), 100)
            .then((value) => {
                expect(value).toBe(11);
                expect(Date.now() - t0).toBeGreaterThan(98);
                done();
            }).catch(faildone);
    });

    it("failure delay", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.delay(Promise.reject(21), 100)
            .then(faildone)
            .catch((reason) => {
                expect(reason).toBe(21);
                expect(Date.now() - t0).toBeGreaterThan(98);
                done();
            });
    });

    it("timeout before success", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.timeout(when.delay(Promise.resolve(31), 1000), 200)
            .then(faildone)
            .catch((reason) => {
                expect(reason).toMatch(/exhausted/);
                expect(Date.now() - t0).toBeGreaterThan(198);
                expect(Date.now() - t0).toBeLessThan(1000);
                done();
            });
    });
    
    it("timeout before failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.timeout(when.delay(Promise.reject(41), 1000), 200)
            .then(faildone)
            .catch((reason) => {
                expect(reason).toMatch(/exhausted/);
                expect(Date.now() - t0).toBeGreaterThan(198);
                expect(Date.now() - t0).toBeLessThan(1000);
                done();
            });
    });
    
    it("Promise failure delay ", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        Promise.reject(51).delay(100)
            .then(faildone)
            .catch((reason) => {
                expect(reason).toBe(51);
                expect(Date.now() - t0).toBeGreaterThan(98);
                done();
            });
    });

});

// end of 012-when.delay-spec.js
