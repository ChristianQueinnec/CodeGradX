// userGetLink.mjs
// Time-stamp: "2019-12-18 17:02:37 queinnec"

import CodeGradX from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export default CodeGradX;

/** Ask for a temporary link to be received by email.

    @param {string} email - real login or email address
    @returns {Promise<User>} yields {User}

*/

CodeGradX.State.prototype.userGetLink = function (email) {
    const state = this;
    state.debug('userGetLink1', email);
    return state.sendAXServer('x', {
        path: '/fromp/getlink',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        entity: {
            email: email
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('userGetLink2', response);
        // This is a very incomplete user record:
        state.currentUser = new CodeGradX.User(response.entity);
        state.cachedUser(user.id, user);
        return Promise.resolve(state.currentUser);
    });
};

// end of userGetLink.mjs
