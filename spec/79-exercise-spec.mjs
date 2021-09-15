// Jasmine test

import { CodeGradX } from '../src/cache.mjs';

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

describe('CodeGradX 79 exercise', function () {
    //CodeGradX.xml2html.default.markFactor = 100;

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
        const state = CodeGradX.getCurrentState();
        state.getAuthenticatedUser(authData.login, authData.password)
            .then(function (user) {
                expect(user).toBeDefined();
                done();
            }, faildone);
    }, 20*1000);

    var campaign1;

    it("gets the 'free' campaign", function (done) {
        var state = CodeGradX.getCurrentState();
        var faildone = make_faildone(done);
        expect(state.currentUser).toBeDefined();
        //console.log(state.currentUser);
        state.currentUser.getCampaign('free').then(function (campaign) {
            expect(campaign).toBeDefined();
            expect(campaign.name).toBe('free');
            campaign1 = campaign;
            done();
        }, faildone);
    });

    it("gets the exercises of the 'free' campaign", function (done) {
        var state = CodeGradX.getCurrentState();
        var faildone = make_faildone(done);
        expect(campaign1).toBeDefined();
        //state.log.show();
        campaign1.getExercisesSet().then(function (es) {
            expect(es).toBeDefined();
            expect(campaign1.exercisesSet).toBe(es);
            done();
        }, faildone);
    }, 10*1000);

    var exercise1;

    it("gets one exercise", function (done) {
        var state = CodeGradX.getCurrentState();
        var faildone = make_faildone(done);
        expect(campaign1).toBeDefined();
        var exerciseName = "com.paracamplus.li205.function.1";
        var promise = campaign1.getExercise(exerciseName);
        promise.then(function (e) {
            expect(e).toBeDefined();
            expect(e.name).toBe(exerciseName);
            e.getDescription().then(function (e2) {
                expect(e2).toBe(e._description);
                exercise1 = e;
                done();
            }, faildone);
        }, faildone);
    });

    var code1 = "int min(int a, int b) { return a; }\n";

    it("sends a string answer to exercise1 and waits for report", 
        function (done) {
            var state = CodeGradX.getCurrentState();
            state.servers = otherServers;
            var faildone = make_faildone(done);
            expect(campaign1).toBeDefined();
            expect(exercise1).toBeDefined();
            exercise1.sendStringAnswer(code1).then(function (job) {
                expect(job).toBeDefined();
                return job.getReport().then(function (job) {
                    expect(job.mark).toBe(0.6);
                    done();
                });
            }).catch(faildone);
        }, 50*1000); // 50 seconds

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
    }, 50*1000); // 50 seconds

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
    
    it("may send a batch", function (done) {
        var state = CodeGradX.getCurrentState();
        state.servers = otherServers;
        var faildone = make_faildone(done);
        CodeGradX.getCurrentState().log.clear();
        expect(exercise2).toBeDefined();
        var parameters = {
            step: 4,
            retry: 40
        };
        var job1;
        exercise2.sendBatch(batchTGZcontent, 'oefgc.tgz')
            .delay(CodeGradX.Batch.prototype.getReport.default.step*1000)
            .then(function (batch) {
                console.log('batch sent!', {batch});
                batch.getReport(parameters).then(function (batch2) {
                    console.log('batch 1st report', {batch2});
                    expect(batch2).toBe(batch);
                    expect(batch2.finishedjobs > 0).toBeTruthy();
                    if ( batch.jobs.one ) {
                        // Hope that this batch report is not the final one!
                        job1 = batch.jobs.one;
                    }
                    batch2.getFinalReport(parameters).then(function (batch3) {
                        console.log('batch final report', {batch3});
                        expect(batch3).toBe(batch2);
                        expect(batch.finishedjobs).toBeGreaterThan(0);
                        expect(batch.totaljobs).toBe(batch.finishedjobs);
                        // Check jobsCache:
                        expect(batch.jobs.one === job1).toBeTruthy();
                        //state.log.show();
                        done();
                    }, faildone);
                }, faildone);
            }, faildone);
    }, 500*1000); // 500 seconds

});
