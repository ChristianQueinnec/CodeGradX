// Jasmine test for user authentication
// requires file ./auth-data.json with login and password (not under git!)
// Don't copy code from this, this is not the regular usage of the library.
// This file was more used as a test and experiment code.

import CodeGradX from '../codegradx.mjs';
import authData from './auth1-data.mjs';     // lambda student

describe('CodeGradX 20', function () {
  it('should be loaded', function () {
    expect(CodeGradX).toBeDefined();
  });

  let firstname, lastname; 
  it('should send authentication request', function (done) {
    var state = new CodeGradX.State();
    state.servers.x[0].host = 'x4.codegradx.org'; // DEBUG
    function faildone (reason) {
      state.debug('faildone', reason).show();
      fail(reason);
      done();
    }
    state.sendAXServer('x', {
      path: '/direct/check',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      entity: authData
    }).then(function (response) {
      //console.log(response);
      expect(response.status).toBeDefined();
      expect(response.status).toBe(200);
      //expect(response.headers['Set-Cookie']).toBeDefined();
      expect(response.entity.kind).toBe('authenticationAnswer');
      console.log(state);
      // currentCookie is now set by CodeGradX.User
      //expect(state.currentCookie).toBeDefined();
      //expect(state.currentCookie).toMatch(/^U.{50,}/);
      state.currentUser = new CodeGradX.User(response.entity);
      expect(state.currentCookie).toBeDefined();
      expect(state.currentCookie).toMatch(/^U.{50,}/);
      expect(state.currentUser.lastname).toBe('FW4EX');
      expect(CodeGradX.getCurrentState()).toBe(state);
      firstname = state.currentUser.firstname;
      lastname = state.currentUser.lastname;
      return state.sendAXServer('x', {
        path: '/direct/check',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    }).then(function (response) {
        console.log('second /direct/check', response.entity);
        // Check that the received cookie is sent
        /////expect(response.raw.request._header).toMatch(/\r\nCookie: u=U/);
        expect(response.entity.kind).toBe('authenticationAnswer');
        expect(response.entity.lastname).toBe(state.currentUser.lastname);
        done();
    }).catch(faildone);
  }, 10*1000); // 10 seconds

  it('again with getAuthenticatedUser', function (done) {
    var state = new CodeGradX.State();
    state.servers.x[0].host = 'x4.codegradx.org'; // DEBUG
    function faildone (reason) {
      state.debug(reason).show();
      fail(reason);
      done();
    }
    state.getAuthenticatedUser(authData.login, authData.password)
    .then(function (user) {
      //console.log(user);
      expect(user).toBeDefined();
      expect(user.lastname).toBe('FW4EX');
      expect(user.lastname).toBe(lastname);
      expect(user.firstname).toBe(firstname);
      expect(user).toBe(state.currentUser);
      expect(state.currentCookie).toBeDefined();
      expect(state.currentCookie).toMatch(/^U.{50,}/);
      console.log(state);
      done();
    }).catch(faildone);
  });

});