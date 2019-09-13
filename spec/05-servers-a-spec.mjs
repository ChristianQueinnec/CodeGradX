// Jasmine tests for servers availability related methods.
// Here we test various kinds of unavailability with a fake UserAgent.

import CodeGradX from '../codegradx.mjs';
import make_fakeUserAgent from './mkFakeUserAgent.mjs';

describe('CodeGradX 05', function () {
  it('should be loaded', function () {
    expect(CodeGradX).toBeDefined();
  });

  function make_faildone (done) {
    return function faildone (reason) {
      var state = CodeGradX.getCurrentState();
      state.debug(reason).show();
      fail(reason);
      done();
    };
  }

  function initializer (state) {
      state.servers = {
          domain: '.localdomain',
          names: ['a', 'e', 'x', 's'],
          protocol: 'http',
          a: {
              suffix: '/alive',
              0: {
                  host: "a0.localdomain",
                  enabled: false
              },
              1: {
                  host: "a1.localdomain",
                  enabled: false
              }
          },
          e: {
              suffix: '/alive',
              0: {
                  host: "e0.localdomain",
                  enabled: false
              },
              1: {
                  host: "e1.localdomain",
                  enabled: false
              }
          },
          x: {
              protocol: 'https',
              suffix: '/dbalive',
              0: {
                  host: "x0.localdomain",
                  enabled: false
              },
              1: {
                  host: "x1.localdomain",
                  enabled: false
              }
          },
          s: {
              suffix: '/',
              0: {
                  host: "s0.localdomain",
                  enabled: false
              },
              1: {
                  host: "s1.localdomain",
                  enabled: false
              }
          }
      };
    return state;
  }

  it('should create a State', function (done) {
    var state = new CodeGradX.State(initializer);
    expect(state).toBeDefined();
    expect(state instanceof CodeGradX.State).toBeTruthy();
    done();
  });

  it('checks A servers: a0 ok', function (done) {
    // since no A server is initially available, check a0 and a1.
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 200
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 400
      }
    ]);
    expect(state).toBeDefined();
    state.checkServers('a').then(function (descriptions) {
      state.log.show(); // DEBUG
      expect(descriptions).toBe(state.servers.a);
      expect(descriptions[0].enabled).toBeTruthy();
      expect(descriptions[0].lastError).not.toBeDefined();
      expect(descriptions[1].enabled).toBeFalsy();
      done();
    }, faildone);
  });

  it('checks A servers: a0 and a1 ok', function (done) {
    // since no A server is initially available, check a0 and a1.
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 200
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 200
      }
    ]);
    expect(state).toBeDefined();
    state.checkServers('a').then(function (descriptions) {
      expect(descriptions).toBe(state.servers.a);
      expect(descriptions[0].enabled).toBeTruthy();
      expect(descriptions[0].lastError).not.toBeDefined();
      expect(descriptions[1].enabled).toBeTruthy();
      expect(descriptions[1].lastError).not.toBeDefined();
      done();
    }, faildone);
  });

  it('request an A server once via a0', function (done) {
    // since no A server is initially available, this will force a
    // checkServers('a') which in turn will trigger checkServer('a', 0)
    // and checkServer('a', 1).
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 200
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 400
      },
      { path: 'http://a0.localdomain/foobar',
        status: 201
      }
    ]);
    expect(state).toBeDefined();
    state.sendAXServer('a', {
      path: '/foobar'
    }).then(function (response) {
      expect(response.status).toBe(201);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(state.servers.a[1].enabled).toBeFalsy();
      done();
    }, faildone);
  });

  it('request an A server twice via a0 while a1 ko', function (done) {
    // since no A server is initially available, this will force a
    // checkServers('a') which in turn will trigger checkServer('a', 0)
    // and checkServer('a', 1).
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 202
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 0
      },
      { path: 'http://a0.localdomain/foo',
        status: 203
      },
      { path: 'http://a0.localdomain/bar',
        status: 204
      }
    ]);
    expect(state).toBeDefined();
    state.sendAXServer('a', {
      path: '/foo'
    }).then(function (response) {
      expect(response.status).toBe(203);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(state.servers.a[1].enabled).toBeFalsy();
      state.sendAXServer('a', {
        path: '/bar'
      }).then(function (response2) {
        expect(response2.status).toBe(204);
        expect(state.servers.a[0].enabled).toBeTruthy();
        expect(state.servers.a[1].enabled).toBeFalsy();
        done();
      }, faildone);
    }, faildone);
  });

  it('request an A server twice via a0 while a1 ok', function (done) {
    // since no A server is initially available, this will force a
    // checkServers('a') which in turn will trigger checkServer('a', 0)
    // and checkServer('a', 1).
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 205
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 206
      },
      { path: 'http://a0.localdomain/foo',
        status: 207
      },
      { path: 'http://a0.localdomain/bar',
        status: 208
      }
    ]);
    expect(state).toBeDefined();
    state.sendAXServer('a', {
      path: '/foo'
    }).then(function (response) {
      expect(response.status).toBe(207);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(state.servers.a[1].enabled).toBeTruthy();
      state.sendAXServer('a', {
        path: '/bar'
      }).then(function (response2) {
        expect(response2.status).toBe(208);
        expect(state.servers.a[0].enabled).toBeTruthy();
        expect(state.servers.a[1].enabled).toBeTruthy();
        done();
      }, faildone);
    }, faildone);
  });

  it('request an A server twice via a0 then a1 (always ok)', function (done) {
    // since no A server is initially available, this will force a
    // checkServers('a') which in turn will trigger checkServer('a', 0)
    // and checkServer('a', 1).
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.log.size = 50;
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 209
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 210
      },
      // 1st request: ok
      { path: 'http://a0.localdomain/foo',
        status: 211
      },
      // 2nd request: ko since a0 subitly failed!
      { path: 'http://a0.localdomain/bar',
        status: 0
      },
      // checkServers('a') again: a0 still ko
      { path: 'http://a0.localdomain/alive',
        status: 402
      },
      // checkServers('a') again, a1 now ok
      { path: 'http://a1.localdomain/alive',
        status: 212
      },
      // 2nd request again: ok
      { path: 'http://a1.localdomain/bar',
        status: 213
      }
    ]);
    expect(state).toBeDefined();
    state.sendAXServer('a', {
      path: '/foo'
    }).then(function (response) {
      expect(response.status).toBe(211);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(state.servers.a[1].enabled).toBeTruthy();
      state.sendAXServer('a', {
        path: '/bar'
      }).then(function (response2) {
        expect(response2.status).toBe(213);
        expect(state.servers.a[1].enabled).toBeTruthy();
        expect(state.servers.a[0].enabled).toBeFalsy();
        done();
      }, faildone);
    }, faildone);
  });

  it('request an A server twice via a0 then a1 (resurrecting)', function (done) {
    // since no A server is initially available, this will force a
    // checkServers('a') which in turn will trigger checkServer('a', 0)
    // and checkServer('a', 1).
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.log.size = 50;
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 214
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 0
      },
      // 1st request: ok
      { path: 'http://a0.localdomain/foo',
        status: 215
      },
      // 2nd request: ko since a0 subitly failed!
      { path: 'http://a0.localdomain/bar',
        status: 0
      },
      // checkServers('a') again: a0 still ko
      { path: 'http://a0.localdomain/alive',
        status: 404
      },
      // checkServers('a') again, a1 now ok
      { path: 'http://a1.localdomain/alive',
        status: 216
      },
      // 2nd request again: ok
      { path: 'http://a1.localdomain/bar',
        status: 217
      }
    ]);
    expect(state).toBeDefined();
    state.sendAXServer('a', {
      path: '/foo'
    }).then(function (response) {
      expect(response.status).toBe(215);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(state.servers.a[1].enabled).toBeFalsy();
      state.sendAXServer('a', {
        path: '/bar'
      }).then(function (response2) {
        expect(response2.status).toBe(217);
        expect(state.servers.a[1].enabled).toBeTruthy();
        expect(state.servers.a[0].enabled).toBeFalsy();
        done();
      }, faildone);
    }, faildone);
  });

  it('request an A server twice via a0 then a1 dying', function (done) {
    // since no A server is initially available, this will force a
    // checkServers('a') which in turn will trigger checkServer('a', 0)
    // and checkServer('a', 1).
    var state = new CodeGradX.State(initializer);
    var faildone = make_faildone(done);
    state.log.size = 50;
    state.userAgent = make_fakeUserAgent([
      // implicit via checkServer('a', 0)
      { path: 'http://a0.localdomain/alive',
        status: 218
      },
      // implicit via checkServer('a', 1)
      { path: 'http://a1.localdomain/alive',
        status: 0
      },
      // 1st request: ok
      { path: 'http://a0.localdomain/foo',
        status: 219
      },
      // 2nd request: ko since a0 subitly failed!
      { path: 'http://a0.localdomain/bar',
        status: 0
      },
      // checkServers('a') again: a0 still ko
      { path: 'http://a0.localdomain/alive',
        status: 405
      },
      // checkServers('a') again, a1 now ok
      { path: 'http://a1.localdomain/alive',
        status: 220
      },
      // 2nd request again, now towards a1: ok
      { path: 'http://a1.localdomain/bar',
        status: 221
      },
      // 3rd request again: ko
      { path: 'http://a1.localdomain/hux',
        status: 0
      },
      // checkServers('a') again: a0 still ko
      { path: 'http://a0.localdomain/alive',
        status: 0
      },
      // checkServers('a') again, a1 still ko
      { path: 'http://a1.localdomain/alive',
        status: 406
      }
    ]);
    expect(state).toBeDefined();
    state.sendAXServer('a', {
      path: '/foo'
    }).then(function (response) {
      expect(response.status).toBe(219);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(state.servers.a[1].enabled).toBeFalsy();
      return state.sendAXServer('a', {
        path: '/bar'
      }).then(function (response2) {
        expect(response2.status).toBe(221);
        expect(state.servers.a[1].enabled).toBeTruthy();
        expect(state.servers.a[0].enabled).toBeFalsy();
        return state.sendAXServer('a', {
          path: '/hux'
        }).then(function (response3) {
          faildone("should not answer");
        }).catch(function (reason) {
          // all servers unavailable
          expect(state.servers.a[0].enabled).toBeFalsy();
          expect(state.servers.a[1].enabled).toBeFalsy();
          //console.log(reason);
          //state.log.show();
          done();
        });
      }, faildone);
    }, faildone);
  });

});
