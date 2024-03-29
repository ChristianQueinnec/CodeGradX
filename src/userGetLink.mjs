// userGetLink.mjs
// Time-stamp: "2021-09-14 18:04:58 queinnec"

import { CodeGradX as cx } from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export const CodeGradX = cx;
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
        const user = state.currentUser = new CodeGradX.User(response.entity);
        return Promise.resolve(user);
    });
};

// end of userGetLink.mjs
