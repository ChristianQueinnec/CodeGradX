// Tests of when.any, when.settle, when.timeout

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

describe("when.any", function () {
    
    function make_faildone (done) {
        return function faildone (reason) {
            //console.log(reason);
            fail(reason);
            done();
        };
    }

    it(" with one success", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.any([Promise.resolve(1)])
            .then((value) => {
                expect(value).toBe(1);
                expect(Date.now() - t0).toBeLessThan(100);
                done();
            }).catch(faildone);
    });
    
    it(" with one success and one failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.any([Promise.resolve(11),
                  Promise.reject(12) ])
            .then((value) => {
                expect(value).toBe(11);
                expect(Date.now() - t0).toBeLessThan(100);
                done();
            }).catch(faildone);
    });
    
    it(" with two failures and one success", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.any([Promise.reject(23),
                  Promise.resolve(21),
                  Promise.reject(22) ])
            .then((value) => {
                expect(value).toBe(21);
                expect(Date.now() - t0).toBeLessThan(100);
                done();
            }).catch(faildone);
    });

    it(" with three failures (one delayed)", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.any([Promise.reject(33),
                  Promise.reject(32),
                  delayedRejection(1000, 34) ])
            .then((value) => {
                console.log(`weird ${value}`);
                faildone();
            }).catch((reasons) => {
                expect(reasons[0]).toBe(33);
                expect(reasons[1]).toBe(32);
                expect(reasons[2]).toBe(34);
                expect(Date.now() - t0).toBeGreaterThan(999);
                expect(Date.now() - t0).toBeLessThan(1100);
                done();
            });
    });

    it(" with two failures and two successes (one delayed)", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.any([Promise.reject(43),
                  Promise.resolve(41),
                  delayedSuccess(1000, 44),
                  Promise.reject(42) ])
            .then((value) => {
                expect(value).toBe(41);
                expect(Date.now() - t0).toBeLessThan(100);
                done();
            }).catch(faildone);
    });

    it(" with two failures and two successes delayed", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.any([Promise.reject(53),
                  delayedSuccess(1000, 51),
                  delayedSuccess(2000, 54),
                  Promise.reject(52) ])
            .then((value) => {
                expect(value).toBe(51);
                expect(Date.now() - t0).toBeGreaterThan(999);
                expect(Date.now() - t0).toBeLessThan(1100);
                done();
            }).catch(faildone);
    });

});

// end of 011-when.any-spec.js
