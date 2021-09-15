// Jasmine test
// Load servers with two concurrent batches (approx 300 seconds)
// This script is probably more useful when more than one vmmdr+ms is active.

import { CodeGradX } from '../codegradx.mjs';

import authData from './auth1-data.mjs';     // lambda student
import _1 from '../src/campaignlib.mjs';
import _2 from '../src/exercise.mjs';
import _3 from '../src/exercisesSet.mjs';
import _4 from '../src/job.mjs';
import { xml2html } from '../src/xml2html.mjs';
import { parsexml } from '../src/parsexml.mjs';
import _7 from '../src/userlib.mjs';
import _8 from '../src/newexercise.mjs';
import _9 from '../src/batch.mjs';

// Some of these tests require s3 and s6 storage servers
// and also working a, e and x servers:
import otherServers from './otherServers.mjs';

describe('CodeGradX 90 batch load', function () {

    function make_faildone (done) {
        return function faildone (reason) {
            var state = CodeGradX.getCurrentState();
            state.debug('faildone', reason).show();
            //console.log(reason);
            fail(reason);
            done();
        };
    }

    let otherServers;
    it('should be loaded', function (done) {
        expect(CodeGradX).toBeDefined();
        CodeGradX.initialize().then((state) => {
            expect(state.servers).toBeDefined();
            // get tests.codegradx.org or localhost.js predefined servers:
            otherServers = state.servers;
            state.plugCache('InlineCache');
            state.mkCacheFor('Campaign');
            state.mkCacheFor('Exercise');
            state.mkCacheFor('ExercisesSet');
            state.mkCacheFor('Job');
            done();
        });
    });

    it('authenticates user', function (done) {
        var faildone = make_faildone(done);
        expect(CodeGradX).toBeDefined();
        var state = CodeGradX.getCurrentState();
        state.getAuthenticatedUser(authData.login, authData.password)
            .then(function (user) {
                expect(user).toBeDefined();
                done();
            }, faildone);
    }, 20*1000);

    var exerciseTGZFile = "./org.example.fw4ex.grading.check.tgz";
    let exerciseTGZcontent = [];
    let exercise2;
    it("get exercise tgz to send", function (done) {
        var state = CodeGradX.getCurrentState();
        var faildone = make_faildone(done);
        CodeGradX.getCurrentState().log.clear();
        state.userAgent({
            path: exerciseTGZFile,
            method: 'GET',
            headers: {
                Accept: 'application/octet-stream'
            }
        })
            .then(response => {
                const contentLength = +response.headers.get('Content-Length');
                expect(contentLength).toBeGreaterThan(100);
                expect(response.entity.length).toEqual(contentLength);
                exerciseTGZcontent = response.entity; // Uint8Array
                done();
            }).catch(faildone);
    });
    
    it("may submit a new exercise and get one pseudojob", function (done) {
        var state = CodeGradX.getCurrentState();
        state.servers = otherServers;
        var faildone = make_faildone(done);
        state.log.size = 50;
        expect(state.currentUser).toBeDefined();
        state.currentUser.submitNewExercise(exerciseTGZcontent, exerciseTGZFile)
            .then(function (exercise) {
                expect(exercise).toBeDefined();
                expect(exercise instanceof CodeGradX.Exercise).toBeTruthy();
                exercise2 = exercise;
                return exercise.getExerciseReport().then(function (e3) {
                    expect(e3).toBe(exercise2);
                    console.log(exercise); // DEBUG
                    var job2 = exercise.pseudojobs.perfect;
                    expect(job2).toBeDefined();
                    return job2.getReport().then(function (job) {
                        expect(job).toBe(job2);
                        expect(job.mark).toBe(100);
                        var job3 = exercise.pseudojobs.half;
                        return job3.getReport().then(function (job) {
                            expect(job).toBe(job3);
                            expect(job.mark).toBe(45);
                            done();
                        });
                    });
                });
            }).catch(faildone);
    }, 75*1000); // 75 seconds

    const batchTGZfile = './oefgc.tgz';
    let batchTGZcontent = [];
    it("get batch tgz to send", function (done) {
        var state = CodeGradX.getCurrentState();
        var faildone = make_faildone(done);
        CodeGradX.getCurrentState().log.clear();
        state.userAgent({
            path: batchTGZfile,
            method: 'GET',
            headers: {
                Accept: 'application/octet-stream'
            }
        })
            .then(response => {
                const contentLength = +response.headers.get('Content-Length');
                expect(contentLength).toBeGreaterThan(100);
                expect(response.entity.length).toEqual(contentLength);
                batchTGZcontent = response.entity; // Uint8Array
                done();
            }).catch(faildone);
    });
    
    it("may send two batches concurrently", function (done) {
        var state = CodeGradX.getCurrentState();
        state.servers = otherServers;
        var faildone = make_faildone(done);
        CodeGradX.getCurrentState().log.clear();
        expect(exercise2).toBeDefined();
        var parameters = {
            step: 4,
            retry: 40
        };
        let count = 0;
        function wrap (promise) {
            return promise
                .delay(CodeGradX.Batch.prototype.getReport.default.step*1000)
                .then(function (batch) {
                    //console.log(batch);
                    return batch.getReport(parameters)
                        .then(function (batch2) {
                            //console.log(batch2);
                            expect(batch2).toBe(batch);
                            return batch2.getFinalReport(parameters);
                        })
                        .then(function (batch3) {
                            expect(batch3).toBe(batch);
                            expect(batch.finishedjobs).toBeGreaterThan(0);
                            expect(batch.totaljobs).toBe(batch.finishedjobs);
                            if ( batch.totaljobs === batch.finishedjobs) {
                                count++;
                            }
                            if ( count === 2 ) {
                                done();
                            }
                        });
                });
        }
        let bat1 = exercise2.sendBatch(batchTGZcontent, 'oefgc.tgz');
        let bat2 = exercise2.sendBatch(batchTGZcontent, 'oefgc.tgz');
        CodeGradX.when.join(wrap(bat1), wrap(bat2))
            .catch(faildone);
    }, 500*1000); // 500 seconds

});
