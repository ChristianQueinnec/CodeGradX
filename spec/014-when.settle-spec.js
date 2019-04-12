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

describe("when.settle", function () {

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
        when.settle([Promise.resolve(11)])
            .then((results) => {
                expect(results.length).toBe(1);
                expect(results[0].state).toBe('fulfilled');
                expect(results[0].value).toBe(11);
                expect(Date.now() - t0).toBeLessThan(100);
                done();
            }).catch(faildone);
    });
    
    it(" with three successes (one delayed)", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.settle([Promise.resolve(21),
                     delayedSuccess(1000, 22),
                     delayedSuccess(1000, 23) ])
            .then((results) => {
                expect(results.length).toBe(3);
                expect(results[0].state).toBe('fulfilled');
                expect(results[0].value).toBe(21);
                expect(results[1].state).toBe('fulfilled');
                expect(results[1].value).toBe(22);
                expect(results[2].state).toBe('fulfilled');
                expect(results[2].value).toBe(23);
                expect(Date.now() - t0).toBeGreaterThan(998);
                expect(Date.now() - t0).toBeLessThan(1100);
                done();
            }).catch(faildone);
    });
    
    it(" with one failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.settle([Promise.reject(31)])
            .then((results) => {
                expect(results.length).toBe(1);
                expect(results[0].state).toBe('rejected');
                expect(results[0].reason).toBe(31);
                done();
            }).catch(faildone);
    });
    
    it(" with three failures (one delayed)", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.settle([Promise.reject(41),
                     delayedRejection(1000, 42),
                     delayedRejection(1000, 43) ])
            .then((results) => {
                expect(results.length).toBe(3);
                expect(results[0].state).toBe('rejected');
                expect(results[0].reason).toBe(41);
                expect(results[1].state).toBe('rejected');
                expect(results[1].reason).toBe(42);
                expect(results[2].state).toBe('rejected');
                expect(results[2].reason).toBe(43);
                expect(Date.now() - t0).toBeGreaterThan(998);
                expect(Date.now() - t0).toBeLessThan(1100);
                done();
            }).catch(faildone);
    });
    
    it(" with two successes (one delayed) and one failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.settle([Promise.resolve(51),
                     delayedSuccess(1000, 52),
                     delayedRejection(1000, 53) ])
            .then((results) => {
                expect(results.length).toBe(3);
                expect(results[0].state).toBe('fulfilled');
                expect(results[0].value).toBe(51);
                expect(results[1].state).toBe('fulfilled');
                expect(results[1].value).toBe(52);
                expect(results[2].state).toBe('rejected');
                expect(results[2].reason).toBe(53);
                expect(Date.now() - t0).toBeGreaterThan(1000);
                expect(Date.now() - t0).toBeLessThan(1100);
                done();
            }).catch(faildone);
    });
    
});

// end of 011-promise.js
