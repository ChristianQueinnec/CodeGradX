// userEnroll.mjs
// Time-stamp: "2021-09-14 18:04:51 queinnec"

import { CodeGradX as cx } from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export const CodeGradX = cx;
export default CodeGradX;

/** Enroll a new user. 

    @param {string} login - email
    @param {string} captcha - g-captcha-response
    @returns {Promise<User>} yields {User}

*/

CodeGradX.State.prototype.userEnroll = function (login, captcha) {
    const state = this;
    state.debug('userEnroll1', login);
    return state.sendAXServer('x', {
        path: '/fromp/enroll',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        entity: {
            email: login,
            'captcha-response': captcha
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('userEnroll2', response);
        const user = state.currentUser = new CodeGradX.User(response.entity);
        return Promise.resolve(user);
    });
};

/** Sign the current version of the User Agreement.

    @param {string} token - signing token
    @returns {Promise<User>} yields {User}

*/

CodeGradX.State.prototype.userSignUA = function (token) {
    const state = this;
    state.debug('userSignUA1', token);
    return state.sendAXServer('x', {
        path: '/fromp/sign/' + token,
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('userSignUA2', response);
        const user = state.currentUser = new CodeGradX.User(response.entity);
        return Promise.resolve(user);
    });
};

// end of userEnroll.mjs
