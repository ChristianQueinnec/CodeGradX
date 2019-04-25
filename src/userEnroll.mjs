// userEnroll.mjs
// Time-stamp: "2019-04-25 18:15:04 queinnec"

import CodeGradX from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
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
            'g-recaptcha-response': captcha
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('userEnroll2', response);
        state.currentUser = new CodeGradX.User(response.entity);
        return Promise.resolve(state.currentUser);
    });
};

// end of userEnroll.mjs
