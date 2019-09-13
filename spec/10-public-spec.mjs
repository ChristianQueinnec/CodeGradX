// Jasmine tests for public interactions

import CodeGradX from '../codegradx.mjs';

import xml2js from '../src/xml2js.mjs';

/** This tests uses the xml2js.ParseString function.
    The xml2js file requires sax and xmlbuilder.
*/

// Some of these tests require s3 and s6 storage servers
// and also working a, e and x servers:
import otherServers from './otherServers.mjs';

describe('CodeGradX 10', function () {

  it('should be loaded', function () {
    expect(CodeGradX).toBeDefined();
  });

    it("erase cookie if any", function (done) {
        var state = new CodeGradX.State();
        function faildone (reason) {
            state.log.show();
            fail(reason);
            done();
        }
        state.checkServers('x')
            .then(function (descriptions) {
                return state.sendAXServer('x', {
                    path: '/fromp/disconnect',
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
            }).then(function (response) {
                expect(response.status).toBe(200);
                expect(response.entity.reason).toMatch(/e126 disconnected/);
                done();
            }).catch(faildone);
    });

  it('should send failing authentication request', function (done) {
    var state = new CodeGradX.State();
    function faildone (reason) {
      state.log.show();
      fail(reason);
      done();
    }
    var promise1 = state.checkServers('x');
    promise1.then(function (descriptions) {
      //console.log(state.servers.x);
      // At least one X server is available:
      expect(descriptions.next).toBeUndefined();
      return state.sendAXServer('x', {
        path: '/direct/check',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        entity: {
          login: 'foo',
          password: 'xyzzy'
        }
      }).then(faildone)
        .catch(function (reason) {
            //state.debug('reason', reason);
            //state.log.show();
            expect(reason.entity.kind).toMatch(/errorAnswer/);
            expect(reason.entity.reason).toMatch(/e152-a/);
            done();
        });
    }).catch(faildone);
  }, 10*1000); // 10 seconds

  it('should get public list of exercises', function (done) {
    var state = new CodeGradX.State();
    function faildone (reason) {
      fail(reason);
      done();
    }
    var promise1 = state.checkServers('e');
    promise1.then(function (descriptions) {
      var promise2 = state.sendESServer('e', {
        path: '/path/insta2',
        headers: {
          'Accept': 'application/json'
        }
      }).then(function (response) {
        //console.log(response);
        expect(response.status).toBe(200);
        var es = new CodeGradX.ExercisesSet(response.entity);
        expect(es).toBeDefined();
        //console.log(es);
        expect(es.title).not.toBeDefined();
        expect(es.exercises.length).toBeGreaterThan(1);
        //console.log(es.exercises[0]);
        expect(es.exercises[0].title).toBe('Javascript');
        expect(es.exercises[0].exercises[0].nickname).toBe('min3');
        done();
      }, faildone);
    }, faildone);
  });

  it('again with implicit checkServers', function (done) {
    var state = new CodeGradX.State();
    state.servers = otherServers;
    function faildone (reason) {
      fail(reason);
      done();
    }
    state.sendESServer('e', {
      path: '/path/insta2',
      headers: {
        'Accept': 'application/json'
      }
    }).then(function (response) {
      //console.log(response);
      expect(response.status).toBe(200);
      var es = new CodeGradX.ExercisesSet(response.entity);
      expect(es).toBeDefined();
      //console.log(es);
      expect(es.title).not.toBeDefined();
      expect(es.exercises.length).toBeGreaterThan(1);
      //console.log(es.exercises[0]);
      expect(es.exercises[0].title).toBe('Javascript');
      expect(es.exercises[0].exercises[0].nickname).toBe('min3');
      done();
    }, faildone);
  });

  it("should get a public job report", function (done) {
    var state = new CodeGradX.State();
    state.log.clear();
    state.servers = otherServers;
    function faildone (reason) {
      state.log.show();
      fail(reason);
      done();
    }
    var promise1 = state.checkServers('s');
    promise1.then(function (descriptions) {
      return state.sendESServer('s', {
        path: "/s/D/B/F/6/0/8/9/8/8/A/0/2/1/1/E/5/8/D/7/4/A/9/8/8/7/0/A/0/6/C/9/0/DBF60898-8A02-11E5-8D74-A98870A06C90.xml"
      }).then(function (response) {
        console.log(response);
        //console.log(response.headers);
        expect(response.status).toBe(200);
        xml2js.parseString(response.entity, function (err, result) {
          if ( err ) {
            faildone(err);
          } else {
            console.log(result);
            expect(result.fw4ex.jobStudentReport).toBeDefined();
            done();
          }
        });
      });
    }).catch(faildone);
  }, 10*1000);

  it("again with implicit checkServers", function (done) {
    var state = new CodeGradX.State();
    state.servers = otherServers;
    function faildone (reason) {
      fail(reason);
      done();
    }
    state.sendESServer('s', {
      path: '/s/D/8/F/A/1/C/4/E/8/7/E/7/1/1/D/D/B/7/3/8/2/E/2/7/1/B/8/B/9/4/E/0/D8FA1C4E-87E7-11DD-B738-2E271B8B94E0.xml'
    }).then(function (response) {
      //console.log(response);
      //console.log(response.headers);
      expect(response.status).toBe(200);
      xml2js.parseString(response.entity, function (err, result) {
        if ( err ) {
          fail(err);
        } else {
          //console.log(result);
          expect(result.fw4ex.jobStudentReport).toBeDefined();
        }
      });
      done();
    }, faildone);
  });

  it("should get a public job report repeatedly", function (done) {
    var state = new CodeGradX.State();
    state.servers = otherServers;
    function faildone (reason) {
      fail(reason);
      done();
    }
    state.sendRepeatedlyESServer('s', {
      step: 1,
      attempts: 5
    }, {
      path: '/s/D/8/F/A/1/C/4/E/8/7/E/7/1/1/D/D/B/7/3/8/2/E/2/7/1/B/8/B/9/4/E/0/D8FA1C4E-87E7-11DD-B738-2E271B8B94E0.xml'
    }).then(function (response) {
      //console.log(response);
      //console.log(response.headers);
      expect(response.status).toBe(200);
      xml2js.parseString(response.entity, function (err, result) {
        if ( err ) {
          fail(err);
        } else {
          //console.log(result);
          expect(result.fw4ex.jobStudentReport).toBeDefined();
        }
      });
      done();
    }, faildone);
  });

});
