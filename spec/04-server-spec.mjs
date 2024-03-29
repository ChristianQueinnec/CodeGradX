// Jasmine tests for servers availability related methods.

import { CodeGradX } from '../codegradx.mjs';

// Some of these tests require at least two servers:
import otherServers from './otherServers.mjs';

describe('CodeGradX 04', function () {
  it('should be loaded', function () {
    expect(CodeGradX).toBeDefined();
  });

  it('should create a State', function () {
    var state = new CodeGradX.State((state) => {
        state.servers = state.defaultservers;
        return state;
    });
    expect(state).toBeDefined();
    expect(state instanceof CodeGradX.State).toBeTruthy();
    expect(state.servers.names).toContain('a');
  });

  it('should check running server A0', function (done) {
   function faildone (reason) {
      var state = CodeGradX.getCurrentState();
      state.debug('faildone', reason).show();
      //console.log(reason);
      fail(reason);
      done();
    }
    var state = new CodeGradX.State();
    state.servers = otherServers;
    var promise = state.checkServer('a', 0);
    promise.then(function (response) {
      //console.log(response.entity);
      //console.log(state.servers.a);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(response.entity.kind).toBe('alive');
      done();
    }, faildone);
  });

  it('should check new running server A1', function (done) {
    function faildone (reason) {
      fail(reason);
      done();
    }
    var state = new CodeGradX.State();
    state.servers = otherServers;
    var promise = state.checkServer('a', 1);
    promise.then(function (response) {
      //console.log(response.entity);
      //console.log(state.servers.a);
      expect(state.servers.a[1].enabled).toBeTruthy();
      expect(response.entity.kind).toBe('alive');
      done();
    }, faildone);
  });

  it('should check new non running server A17', function (done) {
    function faildone (reason) {
      fail(reason);
      done();
    }
    var state = new CodeGradX.State();
    state.servers = otherServers;
    var promise = state.checkServer('a', 17);
    promise.then(function (response) {
      fail("should not happen!");
      done();
    }).catch(function (error) {
      console.log(error);
      //console.log(state.servers.a);
      expect(state.servers.a[17].enabled).toBe(false);
      expect(state.servers.a[17].lastError).toBeTruthy();
      done();
    });
  }, 10*1000);

  it('should check all servers A', function (done) {
    function faildone (reason) {
      fail(reason);
      done();
    }
    var state = new CodeGradX.State();
    state.servers = otherServers;
    var promise = state.checkServers('a');
    promise.then(function (descriptions) {
      //console.log(responses);
      //console.log(state.servers.a);
      expect(descriptions).toBe(state.servers.a);
      expect(state.servers.a[0].enabled).toBeTruthy();
      expect(state.servers.a[1].enabled).toBeTruthy();
      done();
    }, faildone);
  });

  it('should check twice all server A', function (done) {
    function faildone (reason) {
      fail(reason);
      done();
    }
    var state = new CodeGradX.State();
    state.servers = otherServers;
    // Check a0, a1 and try unavailable a2:
    var promise1 = state.checkServers('a');
    promise1.then(function (responses1) {
      //console.log(state.servers.a);
      // Check a0, a1 and try unavailable a2 but don't try a3:
      var promise2 = state.checkServers('a');
      promise2.then(function (responses2) {
        //console.log(state.servers.a);
        expect(state.servers.a.length).toBe(state.servers.a.length);
        expect(state.servers.a.next).toBe(state.servers.a.next);
        done();
      }, faildone);
    }, faildone);
  });

});

// end of codegradx-spec.js
