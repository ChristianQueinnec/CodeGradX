// Jasmine test to discover exercises
// requires file ./auth-data.json with login and password (not under git!)

import CodeGradX from '../src/campaign.mjs';
import authData from './auth1-data.mjs';     // lambda student
import _1 from '../src/campaignlib.mjs';
import _2 from '../src/exercise.mjs';
import _3 from '../src/exercisesSet.mjs';
import _4 from '../src/job.mjs';
import { xml2html } from '../src/xml2html.mjs';
import { parsexml } from '../src/parsexml.mjs';

// Some of these tests require s3 and s6 (or tests) storage servers
// and also working a, e and x servers:
import otherServers from './otherServers.mjs';

describe('CodeGradX 30 exercise', function () {

  function make_faildone (done) {
      return function faildone (reason) {
          var state = CodeGradX.getCurrentState();
          state.debug('faildone', reason).show();
          console.log(reason);
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
          done();
      });
  });

  it('should authenticate', async function (done) {
    expect(CodeGradX).toBeDefined();
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    state.getAuthenticatedUser(authData.login, authData.password)
    .then(function (user) {
      expect(user).toBeDefined();
      expect(user).toBe(state.currentUser);
      done();
    }, faildone);
  });

  var campaign1;  // the 'free' current campaign

  it("should get campaign 'free'", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    expect(state.currentUser instanceof CodeGradX.User).toBeTruthy();
    state.currentUser.getCampaign('free').then(function (campaign) {
      expect(campaign instanceof CodeGradX.Campaign).toBeTruthy();
      expect(campaign.name).toBe('free');
      campaign1 = campaign;
      //console.log(campaign); //
      expect(campaign.starttime instanceof Date).toBeTruthy();
      expect(campaign.endtime instanceof Date).toBeTruthy();
      expect(campaign.starttime.getFullYear()).toBeLessThan(2008);
      expect(campaign.endtime.getFullYear()).toBeGreaterThan(2028);
      //console.log(campaign);
      expect(campaign.exercisesSet).toBeUndefined();
      campaign.getExercisesSet().then(function (es) {
        //console.log(es);
        expect(es instanceof CodeGradX.ExercisesSet).toBeTruthy();
        expect(es).toBe(campaign.exercisesSet);
        campaign.getExercisesSet().then(function (es2) {
            expect(es2).toBe(es);
            done();
        }, faildone);
      }, faildone);
    }, faildone);
  }, 10*1000);

  var campaign2; // the 'insta2-2016oct' past campaign

  it("should get all campaigns", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    expect(state.currentUser instanceof CodeGradX.User).toBeTruthy();
    state.currentUser.getCampaigns().then(function (campaigns) {
      //console.log(campaigns);//DEBUG//////////////////
      expect(campaigns.free).toBeDefined();
      expect(campaigns.free.name).toBe('free');
      campaign2 = campaigns['insta2-2016oct'];
      //console.log(campaign2);// DEBUG
      expect(campaign2).toBeDefined();
      expect(campaign2.name).toBe('insta2-2016oct');
      // the `free` campaign is active:
      //console.log(campaign1.exercisesSet, 'one');//
      state.currentUser.getCampaigns(true).then(function (campaigns2) {
          //console.log(campaigns2);
          expect(campaigns2.free.name).toBe(campaign1.name);
          expect(Object.getOwnPropertyNames(campaigns2).length)
              .toBeLessThan(Object.getOwnPropertyNames(campaigns).length);
          done();
      }).catch(faildone);
    }).catch(faildone);
  });

  // Javascript test
  it("JS tests: checks replace globally", function () {
    var re = new RegExp("^(.)*(<a>(.)*</a>)(.)*$", "g");
    var s1 = "1234<a>X</a>567";
    expect(s1.replace(re, "$2")).toBe("<a>X</a>");

    var reg = new RegExp("<a>.*?</a>", "g");
    expect(s1.match(reg).length).toBe(1);
    expect(s1.match(reg)[0]).toBe("<a>X</a>");

    var s2 = "1234<a>X</a>567<a>YZ</a>89";
    //expect(s1.replace(re, "$2")).toBe("<a>X</a><a>YZ</a>");
    expect(s2.match(reg).length).toBe(2);
    expect(s2.match(reg)[0]).toBe("<a>X</a>");
    expect(s2.match(reg)[1]).toBe("<a>YZ</a>");
  });

  var exercise1; // the org.fw4ex.li101.croissante.0 exercise

  it("get one exercise description", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    expect(campaign1).toBeDefined();
    //console.log(campaign1);////
    campaign1.getExercisesSet().then(function (exercisesSet) {
        expect(exercisesSet).toBeDefined();
        //console.log(exercisesSet);////
        exercise1 = campaign1.exercisesSet.exercises[0].exercises[0];
        expect(exercise1 instanceof CodeGradX.Exercise).toBeTruthy();
        expect(exercise1.nickname).toBe('croissante');
        //console.log(exercise1);
        exercise1.getDescription().then(function (description) {
            //console.log(e);
            expect(exercise1._XMLdescription).toBeDefined();
            expect(exercise1._description).toBe(description);
            expect(exercise1._description.fw4ex).toBeDefined();
            expect(exercise1._description.fw4ex.exerciseContent).toBeDefined();
            // Check authorship:
            expect(exercise1.authorship.length).toBe(1);
            expect(exercise1.authorship[0].firstname).toBe('Christian');
            // check stem:
            expect(exercise1.XMLcontent).toBeDefined();
            // check inlineFileName
            expect(exercise1.inlineFileName).toBe("croissante.scm");
            //console.log(exercise1);
            done();
        }, faildone);
    }, faildone);
  }, 10*1000);

  var exercise2;

  it("get a precise exercise by its name", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    var exerciseName = "com.paracamplus.li205.function.1";
    campaign1.getExercise(exerciseName).then(function (exercise) {
      expect(exercise).toBeDefined();
      expect(exercise.name).toBe(exerciseName);
      exercise.getDescription().then(function (description) {
        expect(exercise.inlineFileName).toBe("min.c");
        exercise2 = exercise;
        done();
      }, faildone);
    }, faildone);
  });

  // ExercisesSet.exercises[0]:
    // 0 -> org.fw4ex.li101.croissante.0
    // 1 -> org.fw4ex.li101.l2p
    // 2 -> com.paracamplus.li205.function.1
    // 3 -> com.paracamplus.li314.java.3
    // 4 -> com.paracamplus.li362.sh.7
    // 5 -> com.paracamplus.li362.tr.4
    // 6 -> com.paracamplus.lt216.1
    // 7 -> org.fw4ex.ocaml.1
  // ExercisesSet.exercises[1]:
    // 8 -> org.fw4ex.li218.devoir.2010nov.3
  it("get a precise exercise by its rank", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    var exerciseName = "com.paracamplus.li314.java.3";
    campaign1.getExercise(3).then(function (exercise) {
      expect(exercise).toBeDefined();
      expect(exercise.name).toBe(exerciseName);
      done();
    }, faildone);
  });

  it("get a precise exercise by its rank", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    var exerciseName = "com.paracamplus.li362.sh.7";
    campaign1.getExercise(4).then(function (exercise) {
      expect(exercise).toBeDefined();
      expect(exercise.name).toBe(exerciseName);
      done();
    }, faildone);
  });

  it("get a precise exercise by its rank", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    var exerciseName = "org.fw4ex.li218.devoir.2010nov.3";
    campaign1.getExercise(8).then(function (exercise) {
      expect(exercise).toBeDefined();
      expect(exercise.name).toBe(exerciseName);
      done();
    }, faildone);
  });

  it("get an absent exercise", function (done) {
    var state = CodeGradX.getCurrentState();
    var faildone = make_faildone(done);
    var exerciseName = "com.paracamplus.li205.function.1,.XXX";
    campaign1.getExercise(exerciseName).then(faildone, function (reason) {
      expect(reason).toBeDefined();
      expect(reason.message).toMatch(/no such exercise/i);
      done();
    });
  });

  var code1 = "" +
  "int min (int a, int b) { \n" +
  "  return (a<b)?a:b; \n" +
  "}\n";

  it("may send an answer", function (done) {
    var state = CodeGradX.getCurrentState();
    state.servers = otherServers;
    var faildone = make_faildone(done);
    expect(exercise2).toBeDefined();
    //console.log(exercise2);
    exercise2.sendStringAnswer(code1).then(function (job) {
      expect(job).toBeDefined();
      //console.log(job);
      expect(job instanceof CodeGradX.Job).toBeTruthy();
      expect(job.jobid).toBeDefined();
      job.getReport().then(function (j) {
        //console.log(report);
        expect(j).toBeDefined();
        expect(j).toBe(job);
        expect(j.finished).toBeDefined();
        expect(j.exerciseid).toBeDefined();
        expect(j.HTMLreport).toBeDefined();
        job.getReport().then(function (j2) {
            expect(j2).toBe(j);
            done();
        }, faildone);
      }, faildone);
    }, faildone);
  }, 100*1000); // 100 seconds

});
