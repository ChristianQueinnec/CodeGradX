// 

import { CodeGradX } from '../codegradx.mjs';

/** make_fakeUserAgent creates HttpResponses (with only a status code)
    as told by `history`. Once used, items in history are removed.
*/

export default function make_fakeUserAgent (history) {
    var fakeUserAgent = function (options) {
        var state = CodeGradX.getCurrentState();
        var i = -1;
        for (let j=0 ; j<history.length ; j++ ) {
            if ( history[j].path === options.path ) {
                i = j;
                break;
            }
        }
        if ( i >= 0 ) {
            state.debug("fakeUserAgent request " + options.path);
            var item = history[i];
            history.splice(i, 1);
            if ( item.status > 0 ) {
                var js = {
                    status: item.status,
                    // Specific headers in fetch API should be accessed with get
                    headers: {
                        get: function (tag) {
                            return undefined;
                        }
                    }
                };
                state.debug("fakeUserAgent response " + item.status);
                return Promise.resolve(js).delay(100 * Math.random());
            } else {
                return Promise.reject("Non responding server " + options.path);
            }
        } else {
            // History was probably incomplete:
            return Promise.reject("Unexpected URL " + options.path);
        }
    };
    CodeGradX.getCurrentState().log = new CodeGradX.Log();
    return fakeUserAgent;
}

// end of mkFakeUserAgent.mjs
