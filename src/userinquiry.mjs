// CodeGradX
// Time-stamp: "2019-12-27 16:04:28 queinnec"

import CodeGradX from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export default CodeGradX;

/** Determine the original site.

    @returns {URLprefix}

*/

CodeGradX.State.prototype.guessDomain = function () {
    let uri = window.document.documentURI;
    const re = new RegExp('^(https?://[^/]+).*$');
    uri = uri.replace(re, "$1");
    return uri;
};

/** Modify the profile of the current user. Data is an object with
    fields among the allowedKeys.

    @param {object} data - fields of the profile to be modified
    @returns {Promise<User>} yields {User}

*/

CodeGradX.State.prototype.userSelfModify = function (data) {
    const state = this;
    state.debug('userSelfModify1');
    const entity = {};
    const allowedKeys = CodeGradX.State.prototype.userSelfModify.allowedKeys;
    for ( let i=0 ; i<allowedKeys.length ; i++ ) {
        const key = allowedKeys[i];
        const value = data[key];
        if ( value ) {
            entity[key] = value;
        }
    }
    return state.sendAXServer('x', {
        path: '/fromp/selfmodify',
        method: 'POST',
        params: { site: state.guessDomain() },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        entity: entity
    }).then(function (response) {
        //console.log(response);
        state.debug('userSelfModify2', response);
        const user = state.currentUser = new CodeGradX.User(response.entity);
        return Promise.resolve(user);
    });
};
CodeGradX.State.prototype.userSelfModify.allowedKeys =
    ['pseudo', 'email', 'lastname', 'firstname', 'password'];

// end of userinquiry.mjs
