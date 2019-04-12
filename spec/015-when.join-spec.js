// Tests of when.join

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

describe("when.join", function () {
    
    function make_faildone (done) {
        return function faildone (reason) {
            console.log(reason);
            fail(reason);
            done();
        };
    }

    it("one success ", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.join(Promise.resolve(11))
            .then((values) => {
                expect(values.length).toBe(1);
                expect(values[0]).toBe(11);
                done();
            }).catch(faildone);
    });

    it("three successes (one delayed)", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.join(Promise.resolve(21),
                  Promise.resolve(22),
                  delayedSuccess(100, 23) )
            .then((values) => {
                expect(Date.now() - t0).toBeGreaterThan(98);
                expect(values.length).toBe(3);
                expect(values[0]).toBe(21);
                expect(values[1]).toBe(22);
                expect(values[2]).toBe(23);
                done();
            }).catch(faildone);
    });
    
    it("three successes (one delayed), one failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.join(Promise.resolve(31),
                  Promise.reject(32),
                  Promise.resolve(33),
                  delayedSuccess(100, 34) )
            .then(faildone)
            .catch((reason) => {
                expect(Date.now() - t0).toBeLessThan(100);
                expect(reason).toBe(32);
                done();
            });
    });

    it("three successes (one delayed), one delayed failure", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.join(Promise.resolve(41),
                  delayedRejection(200, 42),
                  Promise.resolve(43),
                  delayedSuccess(100, 44) )
            .then(faildone)
            .catch((reason) => {
                expect(Date.now() - t0).toBeGreaterThan(198);
                expect(reason).toBe(42);
                done();
            });
    });

    it("two successes (one delayed), two delayed failures", function (done) {
        const faildone = make_faildone(done);
        const t0 = Date.now();
        when.join(delayedSuccess(50, 51),
                  delayedRejection(200, 52),
                  Promise.resolve(53),
                  delayedRejection(100, 54) )
            .then(faildone)
            .catch((reason) => {
                expect(Date.now() - t0).toBeGreaterThan(98);
                expect(reason).toBe(54);
                done();
            });
    });

});
