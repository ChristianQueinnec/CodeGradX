// userGetLink.js
// Time-stamp: "2019-04-03 17:10:42 queinnec"

const CodeGradX = require('codegradx');

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
        return Promise.resolve(state.currentUser);
    });
};

// end of userGetLink.js
