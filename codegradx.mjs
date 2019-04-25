// CodeGradX
// Time-stamp: "2019-04-25 16:35:16 queinnec"

/** Javascript module to interact with the CodeGradX infrastructure.

## Description

In order to remain small, this library contains a number of autoload
functions. This library must be initialized with a name so it may
fetch the configuration associated with that name if it exists
otherwise the default configuration is used.

## Usage

This library makes a huge usage of promises as may be seen in the following
use case:

```javascript
// Example of use:
const CodeGradX = require('codegradx');
CodeGradX.getCurrentState().initialize('someHostName');
... to be done..........................................

```

*/

const CodeGradX = {};

/** Export the `CodeGradX` object */
export default CodeGradX;

// Avoid depending on 'when' or 'bluebird', just define those utilities
// and add them to native Promises.
//const when = require('when');
const when = CodeGradX.when = {
    // wait for all promises to be success or failure:
    settle: function (promises) {
        let done = new Array(promises.length);
        return new Promise((resolve /*, reject */) => {
            const newpromises = 
                  promises.map((promise, index) => {
                      return promise.then((value) => {
                          done[index] = { state: 'fulfilled',
                                          value };
                          //console.log(`Success promise[${index}] with ${value}`);
                      }).catch((reason) => {
                          done[index] = { state: 'rejected',
                                          reason };
                          //console.log(`Failure promise[${index}] ${reason}`);
                      });
                  });
            return Promise.all(newpromises)
                .then(() => {
                    //console.log(`success with `, done);
                    resolve(done);
                });
        });
    },
    // Succeeds if all promises succeed:
    join: function (...promises) {
        let values = new Array(promises.length);
        return new Promise((resolve, reject) => {
            const newpromises = 
                  promises.map((promise, index) => {
                      return promise.then((value) => {
                          values[index] = value;
                          //console.log(`Success promise[${index}] with ${value}`);
                      }).catch((reason) => {
                          reject(reason);
                      });
                  });
            return Promise.all(newpromises)
                .then(() => {
                    //console.log(`success with `, values);
                    resolve(values);
                });
        });
    },
    // Succeed as soon as one of promises is a success:
    any: function (promises) {
        let count = promises.length;
        let done = new Array(promises.length);
        return new Promise((resolve, reject) => {
            const newpromises =
                  promises.map((promise, index) => {
                      return promise.then((value) => {
                          //console.log(`Success promise[${index}] with ${value}`);
                          resolve(value);
                      }).catch((reason) => {
                          //console.log(`Failure promise[${index}] ${reason}`);
                          done[index] = reason;
                          count--;
                      });
                  });
            return Promise.all(newpromises)
                .then(() => {
                    //console.log(`final count=${count}`);
                    if ( count <= 0 ) {
                        //console.log(`final rejection`);
                        reject(done);
                    }
                });
        });
    },
    // Reject if the promise is not settled before delay:
    timeout: function (promise, delay) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(`Duration ${delay} exhausted`);
            }, delay);
            promise.then(resolve, reject);
        });
    },
    // Delay the promise by delay:
    delay: function (promise, delay) {
        return new Promise((resolve, reject) => {
            function waitValue (value) {
                setTimeout(() => {
                    //console.log(`returning ${value} after ${delay}`);
                    resolve(value);
                }, delay);
            }
            function waitReason (reason) {
                setTimeout(() => {
                    //console.log(`throwing ${reason} after ${delay}`);
                    reject(reason);
                }, delay);
            }
            return promise.then(waitValue, waitReason);
        });
    }
};
Promise.prototype.timeout = function (delay) {
    return when.timeout(this, delay);
};
Promise.prototype.delay = function (delay) {
    return when.delay(this, delay);
};

/* Are we running under Node.js */
CodeGradX.isNode = (function (result=undefined) {
    // See http://stackoverflow.com/questions/17575790/environment-detection-node-js-or-browser
    return function () {
        if ( ! result ) {
            /*jshint -W054 */
            const code = "try {return this===global;}catch(e){return false;}";
            const f = new Function(code);
            result = f();
        }
        return result;
    };
})(undefined);

// ******************** General utilities *********************

CodeGradX._str2num = function (str) {
  if (!isNaN(str)) {
    str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
  }
  return str;
};

CodeGradX._str2num2decimals = function (str) {
    const scale = 100; // Leave two decimals
    if ( Number.isFinite(str) ) {
        return (Math.round(scale * str))/scale;
    } else if ( Number.isInteger(str) ) {
        return parseInt(str, 10);
    } else {
        let x = parseFloat(str);
        return (Math.round(scale * x))/scale;
    }
};

CodeGradX._str2Date = function (str) {
    let ms = Date.parse(str);
    if ( ! isNaN(ms) ) {
        const d = new Date(ms);
        //console.log("STR1:" + str + " => " + ms + " ==> " + d);
        return d;
    }
    // Safari cannot Date.parse('2001-01-01 00:00:00+00')
    // but can Date.parse('2001-01-01T00:00:00')
    const rmtz = /^\s*(.+)([+]\d+)?\s*$/;
    str = str.replace(rmtz, "$1").replace(/ /, 'T');
    ms = Date.parse(str);
    if ( ! isNaN(ms) ) {
        const d = new Date(ms);
        //console.log("STR2:" + str + " => " + ms + " ==> " + d);
        return d;
    }
    throw new Error("Cannot parse Date " + str);
};

// On some browsers the ISO string shows the long name of the time zone:
CodeGradX.Date2str = function (date) {
    if ( date ) {
        if ( date instanceof Date ) {
            date = date.toISOString();
        }
        date = date.replace(/[.].*Z?$/, '')
            .replace('T', ' ');
        return date + 'Z';
    }
    return date;
};

/** 
    Compute duration in seconds between two dates (whether Date or String).
 */

CodeGradX.computeDuration = function (end, start) {
    try {
        if ( end instanceof Date ) {
            end = end.getTime();
        } else if ( typeof(end) === 'string' ||
                    end instanceof String ) {
            end = Date.parse(end);
        } else {
            throw new Error("Unknown type of Date");
        }
        if ( start instanceof Date ) {
            start = start.getTime();
        } else if ( typeof(start) === 'string' ||
                    start instanceof String ) {
            start = Date.parse(start);
        } else {
            throw new Error("Unknown type of Date");
        }
        return (end - start)/1000;
    } catch (e) {
        return undefined;
    }
};

// **************** Log ********************************

/** Record facts in a log. This is useful for debug!
    A log only keeps the last `size` facts.
    Use the `show` method to display it.
    See also helper method `debug` on State to log facts.

     @constructor
     @property {Array<string>} items - array of kept facts
     @property {number} size - maximal number of facts to keep in the log

  */

CodeGradX.Log = function () {
    this.items = [];
    this.size = 90;
};

/** Erase the log.

    @returns {Log}
*/

CodeGradX.Log.prototype.clear = function () {
    this.items = [];
    return this;
};

/** Log some facts. The facts (the arguments) will be concatenated
    (with a separating space) to form a string to be recorded in the log.

    @method CodeGradX.Log.debug
    @param {Value} arguments - facts to record
    @returns {Log}
    @lends CodeGradX.Log.prototype
    @alias module:codegradxlib.debug
    */

CodeGradX.Log.prototype.debug = function () {
    function inspect (o) {
        if ( o === undefined ) {
            return 'undefined';
        } else if ( typeof o === 'object' ) {
            let results = [];
            for ( let key of Object.keys(o) ) {
                results.push(`${key}: ${inspect(o[key])}`);
            }
            return `{${results.join(', ')}}`;
        } else if ( Array.isArray(o) ) {
            let results = o.map(inspect);
            return `[${results.join(', ')}]`;
        } else {
            return o.toString();
        }
    }
    // Separate seconds from milliseconds:
    let msg = (''+Date.now()).replace(/(...)$/, ".$1") + ' ';
    for (let i=0 ; i<arguments.length ; i++) {
        if ( arguments[i] === null ) {
            msg += 'null ';
        } else if ( arguments[i] === undefined ) {
            msg += 'undefined ';
        } else {
            msg += inspect(arguments[i], { depth: 2 }) + ' ';
        }
    }
    if ( this.items.length > this.size ) {
        this.items.splice(0, 1);
    }
    this.items.push(msg);
    return this;
};

/** Display the log with `console.log`
    Console.log is asynchronous while writing in a file is synchronous!

    @method show
    @param {Array[object]} items - supersede the log with items
    @param {string} filename - write in file rather than console.
    @returns {Log}
    @memberof {CodeGradX.Log#}

  */

CodeGradX.Log.prototype.show = function (items) {
    // console.log is run later so take a copy of the log now to
    // avoid displaying a later version of the log.
    items = items || this.items.slice(0);
    for ( let item of items ) {
        /* eslint-disable no-console */
        console.log(item);
        /* eslint-enable no-console */
    }
    return this;
};

// **************** Global state *********************************

/** The global state records the instantaneous state of the various
  servers of the CodeGradX constellation. It also holds the current user,
  cookie and campaign. The global `State` class is a singleton that may
  be further customized with the `initializer` function. This singleton
  can be obtained with `getCurrentState()`.

     @constructor
     @param {Function} initializer - optional customizer
     @returns {State}

  The `initializer` will be invoked with the state as first argument.
  The result of initializer() will become the final state.

  */

CodeGradX.State = function (initializer) {
    this.userAgent = this.mkUserAgent();
    this.log = new CodeGradX.Log();
    // State of servers:
    this.servers = {
        // The domain to be suffixed to short hostnames:
        domain: '.codegradx.org',
        // the shortnames of the four kinds of servers:
        names: ['a', 'e', 'x', 's'],
        // default protocol:
        protocol: 'https',
        // Descriptions of the A servers:
        a: {
            // Use that URI to check whether the server is available or not:
            suffix: '/alive',
            protocol: 'https',
            // Description of an A server:
            0: {
                // a full hostname supersedes the default FQDN:
                host: 'a.codegradx.org',
                enabled: false
            }
        },
        e: {
            suffix: '/alive',
            protocol: 'https',
            0: {
                host: 'e.codegradx.org',
                enabled: false
            }
        },
        x: {
            suffix: '/dbalive',
            protocol: 'https',
            0: {
                host: 'x.codegradx.org',
                enabled: false
            }
        },
        s: {
            suffix: '/index.txt',
            protocol: 'https',
            0: {
                host: 's.codegradx.org',
                enabled: false
            }
        }
    };
    // Current values
    this.currentUser = null;
    this.currentCookie = null;
    this.currentCampaign = null;
    this.currentCampaignName = undefined;
    this.currentFileName = undefined;
    // Post-initialization
    let state = this;
    // Cache for jobs useful when processing batches:
    state.cache = {
        jobs: {} 
    };
    if ( typeof initializer === 'function' ||
         initializer instanceof Function ) {
        state = initializer.call(state, state);
    }
    // Make the state global
    CodeGradX.getCurrentState = function () {
        return state;
    };
    return state;
};

/**  This userAgent uses the fetch API available in modern browsers.

     @param {Object} options 
     @returns Promise<response|exception>
*/

CodeGradX.State.prototype.mkUserAgent = function () {
    const state = this;
    async function decodeBody (response) {
        function responseKind (headers) {
            const contentType = headers.get('Content-Type');
            if ( contentType ) {
                if ( /application\/json/.exec(contentType) ) {
                    return 'JSON';
                } else if ( /(application|text)\/xml/.exec(contentType) ) {
                    return 'XML';
                } else if ( /text\/plain/.exec(contentType) ) {
                    return 'TEXT';
                }
            }
            return undefined;
        }
        response.entityKind = responseKind(response.headers);
        if ( response.entityKind &&
             response.entityKind === 'JSON' ) {
            response.entity = await response.json();
        } else if ( response.entityKind &&
                    response.entityKind === 'XML' ) {
            response.entity = await response.text();
        } else {
            // text/plain for instance:
            response.entity = await response.text();
        }
        return response;
    }
    return async function (options) {
        state.debug('userAgent1', options);
        options.redirect = options.redirect || 'follow';
        options.credentials = options.credentials || 'include';
        options.mode = options.mode || 'cors';
        if ( typeof options.entity === 'object' ) {
            let params = [];
            for ( let key of Object.keys(options.entity) ) {
                params.push(encodeURIComponent(key) + '=' +
                            encodeURIComponent(options.entity[key]));
            }
            options.body = params.join('&');
        };
        state.debug('userAgent2', options);
        try {
            const response = await window.fetch(options.path, options);
            state.debug('userAgent3', options, response.ok);
            if ( response.ok ) {
                await decodeBody(response);
                state.debug('userAgent4', response.entityKind);
                return Promise.resolve(response);
            } else if ( 400 <= response.status && response.status < 500 ) {
                await decodeBody(response);
                state.debug('userAgent4 clientError', response);
                return Promise.reject(response);
            } else if ( 500 <= response.status ) {
                state.debug('userAgent4 serverError', response);
                return Promise.reject(response);
            } else if ( ! response.status ) {     // HACK ATTEMPT ???
                await decodeBody(response);
                state.debug('userAgent4 fetchPB', response);
                return Promise.reject(response);
            } else {
                state.debug('userAgent4 PB', response);
                return Promise.reject(response);
            }
        } catch (exc) {
            state.debug('userAgent5 PB', exc);
            return Promise.reject(exc);
        }
    };
};

/** Adjoin current cookie to the request.

    @param {Request} request
    @returns {Request}

 */

CodeGradX.State.prototype.adjoinCurrentCookie = function (kind, request) {
    const state = this;
    if ( state.currentCookie ) {
        //request.credentials = 'include';
        if ( ! request.headers ) {
            request.headers = new Headers.Headers();
        }
        // To send this header would impose a pre-flight:
        //if ( kind !== 's' ) {
        //    request.headers['X-FW4EX-Cookie'] = state.currentCookie;
        //}
        // Cookie is a forbidden header name:
        if ( CodeGradX.isNode() ) {
            request.headers.Cookie = state.currentCookie;
        } else {
            if ( ! document.cookie.indexOf(state.currentCookie) ) {
                document.cookie = state.currentCookie + ";path='/';";
            }
        }
    }
    if ( kind === 's' ) {
        request.credentials = 'omit';
        //request.mode = 'no-cors';
    }
    return request;
};

/** Get the current state or create it if missing.
    The initializer has type State -> State
    This function will be replaced when the state is created.

    @param {function} initializer - post-initialization of the state object
    @returns {State}

*/

CodeGradX.getCurrentState = function (initializer) {
    return new CodeGradX.State(initializer);
};

/** Helper function, add a fact to the log held in the current state
  {@see CodeGradX.Log.debug} documentation.

  @returns {Log}

*/

CodeGradX.State.prototype.debug = function () {
  return this.log.debug.apply(this.log, arguments);
};

/** Empty cache to gain room.
*/

CodeGradX.State.prototype.gc = function () {
    const state = this;
    state.cache.jobs = {};
    // FUTURE remove also .exercises ....................
};

/** Update the description of a server in order to determine if that
  server is available. The description may contain an optional `host`
  key with the name of the host to be checked. If the name is missing,
  the hostname is automatically inferred from the `kind`, `index` and
  `domain` information. After the check, the `enabled` key is set to
  a boolean telling wether the host is available or not.

  Descriptions are gathered in `descriptions` with one additional key:
  `suffix` is the path to add to the URL used to check the
  availability of the server.

  @param {string} kind - the kind of server (a, e, x or s)
  @param {number} index - the index of the server.
  @returns {Promise<Response>} - Promise leading to {HTTPresponse}

  Descriptions are kept in the global state.
  */

CodeGradX.State.prototype.checkServer = function (kind, index) {
  const state = this;
  state.debug('checkServer1', kind, index);
  if ( ! state.servers[kind] ) {
    state.servers[kind] = {};
  }
  const descriptions = state.servers[kind];
  if ( ! descriptions[index] ) {
    descriptions[index] = { enabled: false };
  }
  const description = descriptions[index];
  const host = description.host || (kind + index + state.servers.domain);
  description.host = host;
  description.protocol = description.protocol ||
        descriptions.protocol || state.servers.protocol;
  // Don't use that host while being checked:
  description.enabled = false;
  delete description.lastError;
  function updateDescription (response) {
    state.debug('updateDescription', description.host, response);
    description.enabled = (response.status < 300);
    return Promise.resolve(response);
  }
  function invalidateDescription (reason) {
    state.debug('invalidateDescription', description.host, reason);
    description.enabled = false;
    description.lastError = reason;
    return Promise.reject(reason);
  }
  const url = description.protocol + "://" + host + descriptions.suffix;
  state.debug('checkServer2', kind, index, url);
  const request = {
      path: url
  };
  state.adjoinCurrentCookie(kind, request);
  return state.userAgent(request)
        .then(updateDescription)
        .catch(invalidateDescription);
};

/** Check all possible servers of some kind (a, e, x or s) that is,
    update the state for those servers. If correctly programmed these
    checks are concurrently run but `checkServers` will only be
    resolved when all concurrent checks are resolved. However there is
    a timeout of 3 seconds.

    @param {string} kind - the kind of server (a, e, x or s)
    @returns {Promise} yields Descriptions

    Descriptions = { 0: Description, 1: Description, ... }
    Description = { host: "", enabled: boolean, ... }

    */

CodeGradX.State.prototype.checkServers = function (kind) {
  const state = this;
  state.debug('checkServers', kind);
  const descriptions = state.servers[kind];
  let promise;
  const promises = [];
  for ( let key in descriptions ) {
    if ( /^\d+$/.exec(key) ) {
      key = CodeGradX._str2num(key);
      promise = state.checkServer(kind, key);
      promise = when.timeout(promise, CodeGradX.State.maxWait);
      promises.push(promise);
    }
  }
  function returnDescriptions () {
    state.debug('returnDescriptions', descriptions);
    return Promise.resolve(descriptions);
  }
  return when.settle(promises)
        .then(returnDescriptions)
        .catch(returnDescriptions);
};
CodeGradX.State.maxWait = 3000; // 3 seconds

/** Filter out of the descriptions of some 'kind' of servers those
    that are deemed to be available. If no availableserver is found
    then check all servers.

    @param {string} kind - the kind of server (a, e, x or s)
    @returns {Promise} yielding Array[Description]

    Descriptions = { 0: Description, 1: Description, ... }
    Description = { host: "", enabled: boolean, ... }

*/

CodeGradX.State.prototype.getActiveServers = function (kind) {
    const state = this;
    const descriptions = state.servers[kind];
    function filterEnabled (descriptions, prop='enabled') {
        const result = [];
        for ( const key of Object.keys(descriptions) ) {
            const description = descriptions[key];
            if ( description[prop] ) {
                result.push(description);
            }
        }
        return result;
    }
    function getHosts (hash) {
        return filterEnabled(hash, 'host');
    }
    function getActiveHosts (active) {
        const result = [];
        for ( const description of active ) {
            result.push(description.host);
        }
        return result;
    }
    state.debug("getActiveServers Possible:", kind, getHosts(descriptions));
    let active = filterEnabled(descriptions);
    state.debug('getActiveServers Active:', kind, getActiveHosts(active));
    if ( active.length === 0 ) {
        // check again all servers:
        return state.checkServers(kind)
            .then(function (descriptions) {
                active = filterEnabled(descriptions);
                if ( active.length === 0 ) {
                    const error = new Error(`No available ${kind} servers`);
                    return Promise.reject(error);
                } else {
                    return Promise.resolve(active);
                }
            });
    } else {
        return Promise.resolve(active);
    }
};

/** Check HTTP response and try to elaborate a good error message.
    A good HTTP response has a return code less than 300.

    Error messages look like:
    <?xml version="1.0" encoding="UTF-8"?>
    <fw4ex version='1.0'>
      <errorAnswer>
        <message code='400'>
          <reason>FW4EX e135 Not a tar gzipped file!</reason>
        </message>
      </errorAnswer>
    </fw4ex>

    */

CodeGradX.checkStatusCode = function (response) {
    return Promise.resolve(response);       /// TEMP
    
  const state = CodeGradX.getCurrentState();
  state.debug('checkStatusCode1', response);
  //console.log(response);
    /* eslint no-control-regex: 0 */
  const reasonRegExp = new RegExp("^(.|\n)*<reason>((.|\n)*)</reason>(.|\n)*$");
  function extractFW4EXerrorMessage (response) {
    let reason;
    const contentType = response.headers.get('Content-Type');
    if ( /text\/xml/.exec(contentType) ) {
      //console.log(response.entity);
      reason = response.entity.replace(reasonRegExp, ": $2");
      return reason;
    } else if ( /application\/json/.exec(contentType) ) {
      reason = response.entity.reason;
      return reason;
    } else {
      return '';
    }
  }
  if ( response.status && response.status >= 300 ) {
      const msg = "Bad HTTP code " + response.status + ' ' +
        extractFW4EXerrorMessage(response);
      state.debug('checkStatusCode2', msg);
      //console.log(response);
      const error = new Error(msg);
      error.response = response;
      return Promise.reject(error);
  }
  return Promise.resolve(response);
};

/** Send request to the first available server of the right kind.
    In case of problems, try sequentially the next available server of
    the same kind.

    @param {string} kind - the kind of server (usually a or x)
    @param {object} options - description of the HTTP request to send
    @property {string} options.path
    @property {string} options.method
    @property {object} options.headers - for instance Accept, Content-Type
    @property {object} options.entity - string or object depending on Content-Type
    @returns {Promise} yields {HTTPresponse}

    */

CodeGradX.State.prototype.sendSequentially = function (kind, options) {
    const state = this;
    state.debug('sendSequentially', kind, options);
    
    function regenerateNewOptions (options) {
        const newoptions = Object.assign({}, options);
        newoptions.headers = newoptions.headers || options.headers || {};
        state.adjoinCurrentCookie(kind, newoptions);
        return newoptions;
    }

    function updateCurrentCookie (response) {
        //console.log(response.headers);
        //console.log(response);
        state.debug('sendSequentially updateCurrentCookie', response);
        function extractCookie (tag) {
            let cookies = response.headers.get(tag); // char case ?
            if ( cookies ) { 
                if ( ! Array.isArray(cookies) ) {
                    cookies = [cookies];
                }
                for ( let s of cookies ) {
                    s = s.replace(/;.*$/, '');
                    if ( s.startsWith('u=U') ) {
                        s = s.replace(/^u=/, '');
                        return (state.currentCookie = s);
                    }
                }
            }
        }
        if ( ! extractCookie('Set-Cookie') ) {
            extractCookie('X-CodeGradX-Cookie');
        }
        state.debug('sendSequentially updateCurrentCookie2', state.currentCookie);
        return Promise.resolve(response);
    }

    function mk_invalidate (description) {
        // This function declares the host as unable to answer.
        // Meanwhile, the host may answer with bad status code!
        return function (reason) {
            // With the fetch API, reason is a Response:
            state.debug('sendAXserver invalidate', description, reason);
            //console.log(reason);
            description.enabled = false;
            description.lastError = reason;
            return Promise.reject(reason);
        };
    }
    function send (description) {
        const newoptions = regenerateNewOptions(options);
        newoptions.protocol = newoptions.protocol || 
            description.protocol || state.servers.protocol;
        newoptions.path = newoptions.protocol + '://' +
            description.host + options.path;
        state.debug('sendSequentially send', newoptions);
        return state.userAgent(newoptions)
            .catch(mk_invalidate(description))
            .then(CodeGradX.checkStatusCode)
            .then(updateCurrentCookie);
    }

    function trySequentially (adescriptions) {
        let promise = Promise.reject('start');
        adescriptions.forEach(function (description) {
            promise = promise.catch(function (reason) {
                state.debug('sendSequentially trySequentially', reason);
                return send(description);
            });
        });
        return promise;
    }
    function retrySequentially (reason) {
        state.debug('sendSequentially retry', reason);
        return state.getActiveServers(kind)
            .then(trySequentially);
    }
    
    return state.getActiveServers(kind)
        .then(trySequentially)
        .catch(retrySequentially);
};

/** By default sending to an A or X server is done sequentially until
    one answers positively.
*/

CodeGradX.State.prototype.sendAXServer = function (kind, options) {
    const state = this;
    return state.sendSequentially(kind, options);
};

/** Send request concurrently to all available servers. The fastest wins.

    @param {string} kind - the kind of server (usually e or s)
    @param {object} options - description of the HTTP request to send
    @property {string} woptions.path
    @property {string} options.method
    @property {object} options.headers - for instance Accept, Content-Type
    @property {object} options.entity - string or object depending on Content-Type
    @returns {Promise} yields {HTTPresponse}

*/


CodeGradX.State.prototype.sendConcurrently = function (kind, options) {
    const state = this;
    state.debug('sendConcurrently', kind, options);

    function regenerateNewOptions (options) {
        const newoptions = Object.assign({}, options);
        newoptions.headers = newoptions.headers || options.headers || {};
        state.adjoinCurrentCookie(kind, newoptions);
        return newoptions;
    }

    function mk_invalidate (description) {
        return function seeError (reason) {
            // A MIME deserialization problem may also trigger `seeError`.
            function see (o) {
                let result = '';
                for ( let key in o ) {
                    result += key + '=' + o[key] + ' ';
                }
                return result;
            }
            state.debug('sendConcurrently seeError', see(reason));
            // Don't consider the absence of a report to be a
            // reason to disable the server.
            description.enabled = false;
            description.lastError = reason;
            //const js = JSON.parse(reason.entity);
            return Promise.reject(reason);
        };
    }

    function send (description) {
        const tryoptions = Object.assign({}, regenerateNewOptions(options));
        tryoptions.path = description.protocol + '://' +
            description.host + options.path;
        state.debug("sendConcurrently send", tryoptions.path);
        return state.userAgent(tryoptions)
            .catch(mk_invalidate(description))
            .then(CodeGradX.checkStatusCode);
    }
    
    function tryConcurrently (adescriptions) {
        const promises = adescriptions.map(send);
        return when.any(promises);
    }
    
    return state.getActiveServers(kind)
        .then(tryConcurrently);
};

/** By default requesting an E or S server is done concurrently (except
    when submitting a new exercise).
*/

CodeGradX.State.prototype.sendESServer = function (kind, options) {
    const state = this;
    return state.sendConcurrently(kind, options);
};

/** Ask repeatedly an E or S server.
    Send request to all available servers and repeat in case of problems.

    @param {Object} parameters -
    @property {number} parameters.step - seconds between each attempt
    @property {number} parameters.attempts - at most n attempts
    @property {function} parameters.progress -
    @returns {Promise} yields {HTTPresponse}

    The `progress` function (parameters) {} is invoked before each attempt.
    By default, `parameters` is initialized with
    CodeGradX.State.prototype.sendRepeatedlyESServer.default

    If a server has a 'once' property, it must be asked only once.

  Nota: when.any does not cancel the other concurrent promises.
  */

CodeGradX.State.prototype.sendRepeatedlyESServer =
function (kind, parameters, options) {
    const state = this;
    state.debug('sendRepeatedlyESServer', kind, parameters, options);
    const parms = Object.assign({ i: 0 },
          CodeGradX.State.prototype.sendRepeatedlyESServer.default,
                         parameters);
    let count = parms.attempts;

    function removeOnceServers (adescriptions) {
        const aresult = [];
        for (let item of adescriptions) {
            if ( ! item.once ) {
                aresult.push(item);
            }
        }
        state.debug('sendRepeatedlyESServer Non Once active servers',
                    kind, aresult.map(item => item.host));
        return aresult;
    }
    function retry (reason) {
        state.debug('sendRepeatedlyESServer retry', reason, count--);
        try {
            parms.progress(parms);
        } catch (exc) {
            state.debug('sendRepeatedlyESServer progress', exc);
        }
        if ( count <= 0 ) {
            return Promise.reject(new Error("waitedTooMuch"));
        }
        return state.getActiveServers(kind)
            .then(removeOnceServers)
            .delay(parms.step * 1000)
            .then(function () {
                return state.sendESServer(kind, options);
            })
            .catch(retry);
    }

    return state.sendESServer(kind, options)
        .catch(retry);
};
CodeGradX.State.prototype.sendRepeatedlyESServer.default = {
  step: 3, // seconds
  attempts: 30,
  progress: function (/*parameters*/) {}
};

/** Authenticate the user. This will return a Promise leading to
    some User.

    @param {string} login - real login or email address
    @param {string} password
    @returns {Promise<User>} yields {User}

    */

CodeGradX.State.prototype.getAuthenticatedUser =
function (login, password) {
  const state = this;
  state.debug('getAuthenticatedUser1', login);
  const params = { login, password };
  if ( state.currentCampaignName ) {
      params.campaign = state.currentCampaignName;
  }
  return state.sendAXServer('x', {
    path: '/fromp/connect',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    entity: params
  }).then(function (response) {
    //console.log(response);
    state.debug('getAuthenticatedUser2', response);
    state.currentUser = new CodeGradX.User(response.entity);
    return Promise.resolve(state.currentUser);
  }).catch(function (response) {
      if ( response.entityKind === 'JSON' ) {
          return Promise.reject(response.entity);
      } else {
          return Promise.reject(response.entity);
      }
  });
};

/** Get current user (if defined). This is particularly useful when
    the user is not authenticated via getAuthenticatedUser() (for
    instance, via GoogleOpenId).

    @return {Promise<User>} yields {User}

*/

CodeGradX.getCurrentUser = function (force) {
    const state = CodeGradX.getCurrentState();
    if ( !force && state.currentUser ) {
        return Promise.resolve(state.currentUser);
    }
    state.debug('getCurrentUser1');
    return state.sendAXServer('x', {
        path: '/fromp/whoami',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('getWhoAmI2', response);
        state.currentUser = new CodeGradX.User(response.entity);
        return Promise.resolve(state.currentUser);
    })
        .catch((reason) => {
            state.debug('getCurrentUser2', reason);
            return undefined;
        });
};

/** Disconnect the user.

    @returns {Promise<>} yields undefined

*/

CodeGradX.State.prototype.userDisconnect = function () {
    var state = this;
    state.debug('userDisconnect1');
    return state.sendAXServer('x', {
        path: '/fromp/disconnect',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('userDisconnect2', response);
        state.currentUser = undefined;
        return Promise.resolve(undefined);
    });
};

// **************** User *******************************

/** Represents a User. An User is found by its login and password, the login
    may be a real login (such as upmc:1234567) or an email address.

    @constructor
    @property {string} lastname
    @property {string} firstname
    @property {string} email
    @property {string} cookie
    @property {number} personid
    @property {string} pseudo
    @property {Array<string>} authorprefixes
    @property {Hashtable<Campaign>} _campaigns - Hashtable of current Campaigns
    @property {Hashtable<Campaign>} _all_campaigns - Hashtable of all Campaigns

    Campaigns may be obtained via `getCampaign()` or `getCampaigns()`.

    */

CodeGradX.User = function (json) {
  Object.assign(this, json);
  //console.log(json);
  delete this.kind;
  const state = CodeGradX.getCurrentState();
  if ( this.cookie ) {
      if ( ! state.currentCookie ) {
          state.currentCookie = this.cookie;
      }
  } else if ( state.currentCookie ) {
      this.cookie = state.currentCookie;
  }
  if ( json && 'campaigns' in json ) {
      const campaigns = {};
      json.campaigns.forEach(function (js) {
          //console.log(js);
          const campaign = new CodeGradX.Campaign(js);
          campaigns[campaign.name] = campaign;
      });
      // Just record the current active campaigns:
      this._campaigns = campaigns;
  }
};

// **************** Campaign *********************************

/** A campaign describes a set of exercises for a given group of
    students and a given group of teachers for a given period of time.
    These groups of persons are not public.

      @constructor
      @property {string} name
      @property {Date} starttime - Start date of the Campaign
      @property {Date} endtime - End date of the Campaign
      @property {ExerciseSet} _exercises (filled by getExercises)

      Exercises may be obtained one by one with `getExercise()`.

    */

CodeGradX.Campaign = function (json) {
  // initialize name, starttime, endtime
  Object.assign(this, json);
  this.starttime = CodeGradX._str2Date(json.starttime);
  this.endtime = CodeGradX._str2Date(json.endtime);
  //console.log(this);
};

// **************** Exercise ***************************

/** Exercise. When extracted from a Campaign, an Exercise looks like:

    { name: 'org.fw4ex.li101.croissante.0',
      nickname: 'croissante',
      safecookie: 'UhSn..3nyUSQWNtqwm_c6w@@',
      summary: 'Déterminer si une liste est croissante',
      tags: [ 'li101', 'scheme', 'fonction' ] }

    This information is sufficient to list the exercises with a short
    description of their stem. If you need more information (the stem
    for instance), use the `getDescription` method.

    @constructor
    @property {string} name - full name
    @property {string} nickname - short name
    @property {string} safecookie - long crypted identifier
    @property {string} summary - single sentence qualifying the Exercise
    @property {Array<string>} tags - Array of tags categorizing the Exercise.
    @property {string} server - base URL of the server that served the exercise

    The `getDescription()` method completes the description of an Exercise
    with the following fields:

    @property {XMLstring} _XMLdescription - raw XML description
    @property {Object} _description - description
    @property {Array<Author>} authorship - Array of authorship
    @property {XMLstring} XMLstem - raw XML stem
    @property {string} stem - default HTML translation of the XML stem
    @property {Object} expectations - files expected in student's answer
    @property {Object} equipment - files to be given to the student

    This field may be present if there is a single file in expectations:

    @property {string} inlineFileName - single file expected in student's answer

    */

CodeGradX.Exercise = function (js) {
    function normalizeUUID (uuid) {
        const uuidRegexp = /^(.{8})(.{4})(.{4})(.{4})(.{12})$/;
        return uuid.replace(/-/g, '').replace(uuidRegexp, "$1-$2-$3-$4-$5");
    }
    if ( js.uuid && ! js.exerciseid ) {
        js.exerciseid = normalizeUUID(js.uuid);
    }
    if ( js.uuid && ! js.location ) {
        js.location = '/e' + js.uuid.replace(/-/g, '').replace(/(.)/g, "/$1");
    }
    Object.assign(this, js);
};

CodeGradX.Exercise.js2exercise = function (js) {
    return new CodeGradX.Exercise(js);
};

// **************** ExercisesSet ***************************

/** Initialize a set (in fact a tree) of Exercises with some json such as:

    { "notice": ?,
      "content": [
         { "title": "",
           "exercises": [
               { "name": "", ...}, ...
           ]
         },
         ...
      ]}

    The tree is made of nodes. Each node may contain some properties
    such as `title`, `prologue` (sentences introducing a set of exercises),
    `epilogue` (sentences ending a set of exercises) and `exercises` an
    array of Exercises or ExercisesSet.

    @constructor
    @property {string} title
    @property {string} prologue
    @property {string} epilogue
    @property {Array} exercises - Array of Exercises or ExercisesSet.

      */

CodeGradX.ExercisesSet = function (json) {
  if ( json.content ) {
    // skip 'notice', get array of sets of exercises:
    json = json.content;
  }
  // Here: json is an array of exercises or sets of exercises:
  function processItem (json) {
    if ( json.exercises ) {
      return new CodeGradX.ExercisesSet(json);
    } else {
      if ( json.name && json.nickname ) {
          return new CodeGradX.Exercise(json);
      } else {
          throw new Error("Not an exercise " + JSON.stringify(json));
      }
    }
  }
  if ( Array.isArray(json) ) {
    // no title, prologue nor epilogue.
    this.exercises = json.map(processItem);
  } else {
    // initialize optional title, prologue, epilogue:
    Object.assign(this, json);
    this.exercises = json.exercises.map(processItem);
  }
};

// **************** Job ***************************

/** A Job corresponds to an attempt of solving an Exercise.
    A Job is obtained with `sendStringAnswer` or `sendFileAnswer`.
    From a job, you may get the marking report with `getReport`.

    @constructor
    @property {string} XMLreport - raw XML report
    @property {string} HTMLreport - default HTML from XML report

*/

CodeGradX.Job = function (js) {
    function normalizeUUID (uuid) {
        const uuidRegexp = /^(.{8})(.{4})(.{4})(.{4})(.{12})$/;
        return uuid.replace(/-/g, '').replace(uuidRegexp, "$1-$2-$3-$4-$5");
    }
    if ( js.uuid && ! js.jobid ) {
        js.jobid = normalizeUUID(js.uuid);
    }
    js.mark = CodeGradX._str2num2decimals(js.mark);
    js.totalMark = CodeGradX._str2num2decimals(js.totalMark);
    if ( js.jobid && ! js.pathdir ) {
        js.pathdir = '/s' + js.jobid.replace(/-/g, '').replace(/(.)/g, "/$1");
    }
  Object.assign(this, js);
};

CodeGradX.Job.js2job = function (js) {
    return new CodeGradX.Job(js);
};

// ************************** Batch *************************
/** A Batch is a set of students' answers to be marked by a single
    Exercise. Instantaneous reports or final reports may be obtained
    with the `getReport()` or `getFinalReport()` methods.

    @constructor
    @property {string} label - name of the batch
    @property {number} totaljobs - the total number of students' jobs to mark
    @property {number} finishedjobs - the total number of marked students' jobs
    @property {Hashtable<Job>} jobs - Hashtable of jobs indexed by their label

    */

CodeGradX.Batch = function (js) {
  Object.assign(this, js);
};

/** ******************* Initialization *******************
    Initialization is done in several steps.

   -1- get the current default constellation of a, e, s and x servers.
    This configuration is taken out of an X server as
             x.codegradx.org/constellation/current.json

    -2- get the specialized configuration for the server say
    li101.codegradx.org. This configuration defines the campaign, the
    programming language, the editor, etc. The configuration is held
    on the server itself as
       li101.codegradx.org/config.js
    or on an X server as
      x.codegradx.org/constellation/configuration/li101.codegradx.org/config.js


      @return Promise<> yielding <State>
*/

CodeGradX.initialize = async function () {
    const state = new CodeGradX.State();
    CodeGradX.initializeAutoloads(CodeGradX.autoloads);
    try {
        const servers = await state.getCurrentConstellation();
        state.servers = servers;
    } catch (exc) {
        state.debug('initialize aesx', exc);
    }
    const hostname = document.URL
          .replace(/^https?:\/\//, '')
          .replace(/\/.*$/, '')
          .replace(/:\d+/, '');
    let js = 'true';
    try {
        js = await state.getCurrentConfiguration1(hostname);
    } catch (exc) {
        state.debug('initialize getcurrentconfiguration1', exc);
        try {
            js = await state.getCurrentConfigurationX(hostname);
        } catch (exc) {
            state.debug('initialize getcurrentconfigurationX', exc);
        }
    }
    try {
        const f = eval(`(${js})`);
        f(CodeGradX);
    } catch (exc) {
        state.debug('initialize eval configuration', exc);
    }
    return state;
};

/** Get the current definition of the constellation of aesx servers.
*/

CodeGradX.State.prototype.getCurrentConstellation = function () {
    const state = this;
    state.debug('getCurrentConstellation1');
    return state.sendAXServer('x', {
        path: `/constellation/aesx`,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('getCurrentConstellation2', response);
        return response.entity;
    }).catch(function (exc) {
        state.debug('getCurrentConstellation3', exc);
        return state;
    });
};

/** Get the configuration from the server itself.
 */

CodeGradX.State.prototype.getCurrentConfiguration1 = function (hostname) {
    const state = this;
    state.debug('getCurrentConfiguration11');
    return state.userAgent({
        path: `/${hostname}.js`,
        method: 'GET',
        headers: {
            'Accept': 'application/javascript',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('getCurrentConfiguration12', response);
        return response.entity;
    }).catch(function (exc) {
        state.debug('getCurrentConfiguration13', exc);
        return state;
    });
};

/** Get the configuration from an X server.
 */

CodeGradX.State.prototype.getCurrentConfigurationX = function (hostname) {
    const state = this;
    state.debug('getCurrentConfigurationX1');
    return state.sendAXServer('x', {
        path: `/constellation/configuration/${hostname}.js`,
        method: 'GET',
        headers: {
            'Accept': 'application/javascript',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('getCurrentConfigurationX2', response);
        return response.entity;
    }).catch(function (exc) {
        state.debug('getCurrentConfigurationX3', exc);
        return state;
    });
};

/** ******************* Initialization *******************
    CodeGradX requires sax, xml2js 
    xml2js requires sax, xmlbuilder
      sax requires (if stream [useless]) stream, string_decoder)
      xmlbuilder only requires internal files

    xml2html requires sax
    parsexml requires xml2js
    exercise requires xml2js

    An implementation of require using dynamic load. 
    loadrequire returns a promise that yields the module.exports 
    value of the module.
    
    @param {String} modulename
    @returns Promise<Object> yields the exports object

    Modules are kept on the server within the extras/ directory.

*/

// Sapper does not like 'import.'
CodeGradX.mkrequire = function (urlbase=import.meta.url) {
//CodeGradX.mkrequire = function (urlbase) {
    return async function require (file, name=undefined) {
        try {
            if ( file.startsWith('./') && ! file.endsWith('.js') ) {
                file += '.js';
            }
            const url = new URL(file, urlbase);

            if ( CodeGradX.requireCache[file] ) {
                return Promise.resolve(CodeGradX.requireCache[file]);
            } else if ( CodeGradX.requireCache[url] ) {
                return Promise.resolve(CodeGradX.requireCache[url]);
            } else if ( name && CodeGradX.requireCache[name] ) {
                return Promise.resolve(CodeGradX.requireCache[name]);
            }
            
            const response = await window.fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/javascript',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            //console.log(response);
            if ( ! response.ok ) {
                const msg = `Unfetchable module ${url} (${response.status})`;
                throw new Error(msg);
            }
            const js = await response.text();
            let result;
            let module = { exports: {} };
            result = new Function('require', 'module', 'exports', js);
            let newrequire = CodeGradX.mkrequire(url);
            result(newrequire, module, module.exports);
            if ( module.exports ) {
                CodeGradX.requireCache[file] = module.exports;
                CodeGradX.requireCache[url] = module.exports;
                if ( name ) {
                    CodeGradX.requireCache[name] = module.exports;
                }
                return Promise.resolve(module.exports);
            } else {
                throw new Error(`Missing module.exports in ${file}`);
            }
        } catch (exc) {
            //console.log(`require problem ${exc}`);
            return Promise.reject(exc);
        }
    };
};
CodeGradX.requireCache = {};
// const require = CodeGradX.mkrequire();

/** 
    In order to take benefit from autoload, one should convert 
       result = o.f(a,b) 
    into 
       o.f(a,b).then((result) => { ... });

    All autoload methods are converted into Promises.

    The dynamically loaded files must look like:

   module.exports = function (CodeGradX) {
       ...
   }

   This module can only require other modules such as he, sax, xml2js.

*/

CodeGradX.initializeAutoloads = function (autoloads) {
    const state = CodeGradX.getCurrentState();
    const require = CodeGradX.mkrequire('/extras/');
    async function load (file) {
        state.debug('autoload', file);
        const exports = require(file);
        exports(CodeGradX);
    }
    function mkAutoloadFunction (klass) {
        let file = autoloads[klass];
        //console.log(`Autoload CodeGradX.${klass}`);
        const loader = function (...args) {
            const self = this;
            state.debug('Autoload1', klass, self, args);
            return load(file).then(() => {
                state.debug('Autoload2', klass, self, args);
                const newfunction = CodeGradX[klass];
                if ( newfunction !== loader ) {
                    try {
                        const result = newfunction.apply(self, args);
                        return Promise.resolve(result);
                    } catch (exc) {
                        return Promise.reject(exc);
                    }
                } else {
                    const exc = new Error(`Bad autoload for ${file}`);
                    return Promise.reject(exc);
                }
            }).catch((exc) => {
                state.debug('Autoload3', klass, exc);
                return Promise.reject(exc);
            });
        };
        CodeGradX[klass] = loader;
    }
    function mkAutoloadMethod (klass, name) {
        let file = autoloads[klass][name];
        //console.log(`Autoload CodeGradX.${klass}.prototype.${name}`);
        const loader = function (...args) {
            const self = this;
            state.debug('Autoloads1', klass, name, self, args);
            return load(file).then(function () {
                state.debug('Autoloads2', klass, name);
                const newfunction = CodeGradX[klass].prototype[name];
                if ( newfunction !== loader ) {
                    try {
                        const result = newfunction.apply(self, args);
                        return Promise.resolve(result);
                    } catch (exc) {
                        return Promise.reject(exc);
                    }
                } else {
                    const exc = new Error(`Bad autoloads for ${name} and ${file}`);
                    return Promise.reject(exc);
                }
            }).catch(function (exc) {
                state.debug('Autoloads3', klass, name, exc);
                return Promise.reject(exc);
            });
        };
        CodeGradX[klass].prototype[name] = loader;
    }
    for ( let klass in autoloads ) {
        if ( typeof autoloads[klass] === 'string' ) {
            mkAutoloadFunction(klass);
        } else {
            for ( let name in autoloads[klass] ) {
                mkAutoloadMethod(klass, name);
            }
        }
    }
};

CodeGradX.autoloads = {
    xml2html: 'xml2html.mjs',
    parsexml: 'parsexml.mjs',
    State: {
        userGetLink: 'userGetLink.mjs',
        userEnroll:  'userEnroll.mjs'
    },
    User: {
        getCampaigns: 'campaign.mjs',
        getCampaign: 'campaign.mjs',
        getCurrentCampaign: 'campaign.mjs',
        getProgress: 'userlib.mjs',
        getAllJobs: 'userlib.mjs',
        getAllExercises: 'userlib.mjs'
    },
    Campaign: {
        getExercisesSet: 'campaignlib.mjs',
        getExercise: 'campaignlib.mjs',
        getExercises: 'campaignlib.mjs',
        getJobs: 'campaignlib.mjs',
        getSkills: 'campaignlib.mjs',
        getBatches: 'campaignlib.mjs',
        getCampaignStudentJobs: 'campaignlib.mjs'
    },
    Exercise: {
        getDescription: 'exercise.mjs',
        getEquipmentFile: 'exercise.mjs',
        sendStringAnswer: 'exercise.mjs',
        sendFileFromDOM: 'exercise.mjs',
        sendBatchFromDOM: 'exercise.mjs',
        getExerciseReport: 'exercise.mjs',
        getBaseURL: 'exercise.mjs',
        getExerciseReportURL: 'exercise.mjs',
        getTgzURL: 'exercise.mjs'
    },
    ExercisesSet: {
        getExercise: 'exercisesSet.mjs',
        getExerciseByName: 'exercisesSet.mjs',
        getExerciseByIndex: 'exercisesSet.mjs',
    },
    Job: {
        getReport: "job.mjs",
        getProblemReport: "job.mjs",
        getReportURL: "job.mjs",
        getProblemReportURL: "job.mjs",
        getTgzURL: "job.mjs"
    },
    Batch: {
        getReport: 'batch.mjs',
        getFinalReport: 'batch.mjs',
        getReportURL: 'batch.mjs'
    }
};

// end of codegradx.mjs
