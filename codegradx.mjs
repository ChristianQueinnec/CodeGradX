// CodeGradX
// Time-stamp: "2021-02-11 10:26:57 queinnec"

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
import { CodeGradX } from 'codegradx';
CodeGradX.getCurrentState().initialize('someHostName');
... to be done..........................................

```

*/

/** Export the `CodeGradX` object */
export const CodeGradX = {};
// module.exports = { CodeGradX };

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
    // Delay the return of a promise by delay:
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

/** Convert a string into a Date.

    from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse

    "2011-10-10" (date-only form), 
    "2011-10-10T14:48:00" (date-time form), or 
    "2011-10-10T14:48:00.000+09:00" (date-time form with milliseconds 
                                     and time zone) 
    When the time zone offset is absent, 
     - date-only forms are interpreted as a UTC time and 
     - date-time forms are interpreted as local time.
*/

CodeGradX._str2Date = function (str) {
    //console.log(`str0=${str}`);
    str = str.replace(/^(\d{4}-\d{2}-\d{2})([+].*)?$/, '$1T00:00:00$2');
    //console.log(`str01=${str}`);
    str = str.replace(/^(\d{4}-\d{2}-\d{2}) (.*)$/, "$1T$2");
    //console.log(`str1=${str}`);
    str = str.replace(/Z$/, "+00:00");
    //console.log(`str2=${str}`);
    str = str.replace(/([+]\d{2})$/, "$1:00");
    //console.log(`str3=${str}`);
    if ( ! str.match(/[+]/) ) {
        // Assume the date without timezone to be in UTC:
        str += "+00:00";
        //console.log(`str4=${str}`);
    }
    let ms = Date.parse(str);
    if ( ! isNaN(ms) ) {
        const d = new Date(ms);
        //console.log(`Date=${d.toISOString()}`);
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
    function inspect (o, maxdepth) {
        if ( maxdepth <= 0 ) {
            return '...';
        } else if ( o === undefined ) {
            return 'undefined';
        } else if ( typeof o === 'object' ) {
            let results = [];
            for ( let key of Object.keys(o) ) {
                results.push(`${key}: ${inspect(o[key], maxdepth-1)}`);
            }
            return `{${results.join(', ')}}`;
        } else if ( Array.isArray(o) ) {
            let results = [];
            for ( let i=0 ; i<o.length ; i++ ) {
                results.push(inspect(o[i], maxdepth-1));
            }
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
            msg += inspect(arguments[i], 2) + ' ';
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
    //console.log('new State ...'); // DEBUG
    this.userAgent = this.mkUserAgent();
    this.log = new CodeGradX.Log();
    // State of servers [this may be changed with .getCurrentConstellation()]
    this.servers = undefined;
    this.defaultservers = {
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
            // Description of plausible A servers:
            0: {
                // a full hostname supersedes the default FQDN:
                host: 'a6.codegradx.org',
                enabled: false
            },
            1: {
                host: 'a10.codegradx.org',
                enabled: false
            },
            2: {
                host: 'a9.codegradx.org',
                enabled: false
            }
        },
        e: {
            suffix: '/alive',
            protocol: 'https',
            0: {
                host: 'e6.codegradx.org',
                enabled: false
            },
            1: {
                host: 'e10.codegradx.org',
                enabled: false
            },
            2: {
                host: 'e9.codegradx.org',
                enabled: false
            }
        },
        x: {
            suffix: '/dbalive',
            protocol: 'https',
            0: {
                host: 'x6.codegradx.org',
                enabled: false
            },
            1: {
                host: 'x10.codegradx.org',
                enabled: false
            },
            2: {
                host: 'x9.codegradx.org',
                enabled: false
            }
        },
        s: {
            suffix: '/index.txt',
            protocol: 'https',
            0: {
                host: 's3.codegradx.org',
                enabled: false
            },
            1: {
                host: 's6.codegradx.org',
                enabled: false
            },
            2: {
                host: 's10.codegradx.org',
                enabled: false
            },
            3: {
                host: 's9.codegradx.org',
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
    this.currentExercise = null;
    // Post-initialization
    let state = this;
    // Cache for jobs and exercises:
    state.cache = Object.create(null);
    state.mkCacheFor('Exercise');
    state.mkCacheFor('Job');

    function customize (state, initializer) {
        if ( typeof initializer === 'function' ||
             initializer instanceof Function ) {
            state = initializer.call(state, state);
        }
        return state;
    }
    // Make the state global:
    CodeGradX.getCurrentState = function (initializer) {
        state = customize(state, initializer);
        //console.log('getcurrentstate overriding', state); // DEBUG
        return state;
    };
    state = customize(state, initializer);
    //console.log('created new State', state); // DEBUG
    return state;
};

/** Get the current state or create it if missing.
    The initializer has type State -> State
    This function will be replaced when the state is created.

    @param {function} initializer - post-initialization of the state object
    @returns {State}

*/

CodeGradX.getCurrentState = function (initializer) {
    //console.log('getcurrentstate basic', state); // DEBUG
    return new CodeGradX.State(initializer);
};

/** Cache interface. It may clear, get or set the cache. All these
    functionalities are gathered in one function so it may be patched
    to use LocalStorage for instance. 

    It assumes state.cache.X to be a Cache instance, then

    state.cachedX()           -- clears the cache
    state.cachedX(key)         -- returns X with key
    state.cachedX(key, value)  -- insert key=>value into cache

*/

CodeGradX.Cache = function (kind) {
    if ( typeof window !== 'undefined' && window.localStorage ) {
        return new CodeGradX.LocalStorageCache(kind);
    } else {
        return new CodeGradX.InlineCache();
    }
};

/** Inline Cache. Cached values are stored in memory.
 */

CodeGradX.InlineCache = function () {
    return new Map();
};

CodeGradX.InlineCache.prototype.clear = function () {
    const cache = this;
    cache.clear();
};

CodeGradX.InlineCache.prototype.get = function (key) {
    const cache = this;
    return cache.get(key);
};

CodeGradX.InlineCache.prototype.set = function (key, thing) {
    const cache = this;
    cache.set(key, thing);
    return thing;
};

/** Local Storage Cache. */

CodeGradX.LocalStorageCache = function (kind) {
    this.kind = kind;
};

CodeGradX.LocalStorageCache.prototype.clear = function () {
    const cache = this;
    const reKind = new RegExp(`^${cache.kind}:`);
    const keys = [];
    // Since it is dangerous to iterate on a collection while removing
    // items from that collection, first collect the keys to remove:
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if ( key.match(reKind) ) {
            keys.push(key);
        }
    }
    keys.forEach((key) => localStorage.removeItem(key));
};

CodeGradX.LocalStorageCache.prototype.get = function (key) {
    const cache = this;
    key = `${cache.kind}:${key}`;
    return localStorage.getItem(key);
};

CodeGradX.LocalStorageCache.prototype.set = function (key, thing) {
    const cache = this;
    key = `${cache.kind}:${key}`;
    try {
        localStorage.setItem(key, thing);
    } catch (_) {
        // Probably a QuotaExceededError
        // remove oldest keys ???
        cache.clear();
    }
    return thing;
};

/** Utility function to clear, get or set a Cache instance. Every
    value is turned into a String (this process is possibly customized
    with a jsonize method.
*/

CodeGradX.State.prototype.mkCacheFor = function (kind) {
    const state = this;
    const JSONprefix = 'JSON:';
    state.cache[kind] = new CodeGradX.Cache(kind);
    state[`cached${kind}`] = function (key, thing) {
        const state = this;
        if ( key ) {
            if ( thing ) {
                try {
                    let newthing = thing;
                    if ( typeof thing === 'object' ) {
                        try {
                            newthing = JSONprefix + thing.jsonize();
                        } catch (_) {
                            try {
                                newthing = JSONprefix + JSON.stringify(thing);
                            } catch (exc) {
                                state.debug('jsonize problem', thing, exc);
                            }
                        }
                    } else {
                        try {
                            newthing = JSON.stringify({_: thing});
                        } catch (_) {
                            state.debug('jsonize failure', thing);
                        }
                    }
                    return state.cache[kind].set(key, newthing);
                } catch (_) {
                    // ignore, thing is not cached!
                }
            } else {
                let newthing = state.cache[kind].get(key);
                if ( typeof newthing === 'string' ) {
                    try {
                        if ( newthing.match(`^${JSONprefix}`) ) {
                            return JSON.parse(newthing.slice(JSONprefix.length));
                        } else {
                            let result = JSON.parse(newthing);
                            return result._;
                        }
                    } catch (_) {
                        state.debug(`Cannot decode cached`, newthing);
                        return undefined;
                    }
                } else {
                    // Should never appear!
                    state.debug(`Weird cached value`, newthing);
                    return undefined;
                }
            }
        } else {
            state.cache[kind].clear();
        }
        return thing;
    };
};

/** Utility function that builds a new stringified Object from thing
    with the keys.
    
    @params Object thing - the object to partially clone
    @params Array<String> keys - the keys to clone
    @returns JSONstring
*/

CodeGradX.jsonize = function (thing, keys) {
    const o = {};
    for (let key of keys) {
        let value = thing[key];
        if ( value ) {
            o[key] = thing[key];
        }
    }
    return JSON.stringify(o);
};

// Campaigns do not need to be cached, they are already stored in real
// memory the User object.

// ExercisesSet do not need to be cached, they are already stored in
// their associated Campaign.

// Exercises are cached under their full name, the cached exercise
// contains the stem, lang, summary, authorship, etc.

// Jobs are cached only after fetching the student's report.

/**  This userAgent uses the fetch API available in modern browsers.

     @param {Object} options 
     @returns Promise<response|exception>
*/

CodeGradX.State.prototype.mkUserAgent = function (fetch) {
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
                } else if ( /application\/octet-stream/.exec(contentType) ) {
                    return 'BYTES';
                }
            }
            return undefined;
        }
        response.entityKind = responseKind(response.headers);
        //console.log('response.entityKind', response.entityKind); // DEBUG
        if ( response.entityKind &&
             response.entityKind === 'JSON' ) {
            response.entity = await response.json();
        } else if ( response.entityKind &&
                    response.entityKind === 'XML' ) {
            response.entity = await response.text();
        } else if ( response.entityKind &&
                    response.entityKind === 'BYTES' ) {
            response.entity = await readBytes(response.body);
        } else {
            // text/plain for instance:
            response.entity = await response.text();
        }
        return response;
    }
    async function readBytes (stream) {
        let result = new Uint8Array();
        const reader = stream.getReader();
        function processBytes ({ done, value }) {
            if ( done ) {
                return Promise.resolve(result);
            } else {
                const newresult = new Uint8Array(result.length + value.length);
                newresult.set(result, 0);
                newresult.set(value, result.length);
                result = newresult;
                return reader.read().then(processBytes);
            }
        }
        return reader.read().then(processBytes);
    }
    return async function tryRequest (options) {
        state.debug('userAgent1', options);
        function cannotFetch (path /*, options */) {
            throw `Cannot fetch ${path}!!!`;
        }
        fetch = fetch || state.fetch ||
            ((typeof window !== 'undefined') ?
             window.fetch : cannotFetch);
        state.debug('mkUserAgent fetch is', fetch); //DEBUG
        options.redirect = options.redirect || 'follow';
        options.mode = options.mode || 'cors';
        if ( options.mode === 'no-cors' ) {
            options.credentials = options.credentials || 'omit';
        } else {
            options.credentials = options.credentials || 'include';
        }
        if ( options.entity ) {
            if ( options.entity instanceof Uint8Array ) {
                options.body = new Blob([options.entity],
                                        {type: 'application/octet-stream'});
            } else if ( options.entity instanceof FormData ) {
                options.body = options.entity;
            } else if ( typeof options.entity === 'object' ) {
                let params = [];
                for ( let key of Object.keys(options.entity) ) {
                    params.push(encodeURIComponent(key) + '=' +
                                encodeURIComponent(options.entity[key]));
                }
                options.body = params.join('&');
            } else if ( typeof options.entity === 'string' ) {
                options.body = options.entity;
            }
        }
        state.debug('userAgent2', options);
        try {
            const response = await fetch(options.path, options);
            state.debug('userAgent3', options, response);
            if ( response.redirected ) {
                state.debug('userAgent4 redirect', response);
                // This is the final response, we just know that it was
                // obtained via redirection
                return Promise.resolve(response);
            } else if ( response.ok ) {
                await decodeBody(response);
                state.debug('userAgent4', response.entityKind);
                return Promise.resolve(response);
            } else if ( 400 <= response.status && response.status < 500 ) {
                await decodeBody(response);
                state.debug('userAgent4 clientError',
                            response.status, response);
                return Promise.reject(response);
            } else if ( 500 <= response.status ) {
                state.debug('userAgent4 serverError',
                            response.status, response);
                return Promise.reject(response);
            } else if ( ! response.status ) {
                // response.status === 0 suggests a CORS issue
                state.debug('userAgent4 fetchPB',
                            response.status, response);
                return Promise.reject(response);
            } else {
                state.debug('userAgent4 PB',
                            response.status, response);
                return Promise.reject(response);
            }
        } catch (exc) {
            //state.debug('userAgent5 PB', exc.message);
            state.debug('userAgent5 PB', JSON.stringify(exc));
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
            request.headers = {};
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
    for ( let key of Object.keys(state.cache) ) {
        state.cache[key].clear();
    }
    state.cache = Object.create(null);
    state.mkCacheFor('Exercise');
    state.mkCacheFor('Job');
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
  if ( ! state.servers ) {
      state.debug('checkServer', "uninitialized state.servers");
      state.servers = {
          domain: '.codegradx.org',
          names: ['a', 'e', 'x', 's'],
          protocol: 'https'
      };
  }        
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
  description.prefix = description.prefix || '';
  // Don't use that host while being checked:
  description.enabled = false;
  delete description.lastError;
  function adjoinHost(descriptions, host) {
      let maxkey = 0;
      for ( let key in descriptions ) {
          if ( /^\d+$/.exec(key) ) {
              key = CodeGradX._str2num(key);
              maxkey = (maxkey < key) ? key : maxkey;
              const oldhost = descriptions[key];
              if ( oldhost.host === host ) {
                  // host is already known!
                  state.debug('updateDescription adjoin already known', host);
                  return;
              }
          }
      }
      // host is not known
      state.debug('updateDescription adjoin', host, descriptions);
      descriptions[maxkey+1] = { host, enabled: false };
  }
  function updateDescription (response) {
      state.debug('updateDescription', description.host, response);
      if ( response.status < 300 ) {
          description.enabled = true;
          return Promise.resolve(response);
      } else if ( response.status === 302 ||
                  response.status === 307 ) {
          const location = response.headers.get('Location');
          const host = location.replace(/^https?:\/\/([^/]+)\/.*$/, '$1');
          adjoinHost(descriptions, host);
      } else {
          return Promise.reject(response.status);
      }
  }
  function invalidateDescription (reason) {
    state.debug('invalidateDescription', description.host, reason);
    description.enabled = false;
    description.lastError = reason;
    return Promise.reject(reason);
  }
  function tryServer (url) {
      state.debug('checkServer2', kind, index, url);
      const request = {
          //mode: 'no-cors',
          path: url
      };
      state.adjoinCurrentCookie(kind, request);
      return state.userAgent(request)
          .then(updateDescription)
          .catch(invalidateDescription);
  }
    const url = description.protocol + "://" + host +
          description.prefix + descriptions.suffix;
    return tryServer(url);
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
  // return immediately if there is at least one enabled server:  
  for ( const key of Object.keys(descriptions) ) {
      const description = descriptions[key];
      if ( description.enabled ) {
          return Promise.resolve(descriptions);
      }
  }
  // Otherwise, check for all possible servers:
  const promises = [];
  for ( let key in descriptions ) {
    if ( /^\d+$/.exec(key) ) {
      key = CodeGradX._str2num(key);
      let promise = state.checkServer(kind, key);
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
                    state.debug('getActiveServers', error);
                    return Promise.reject(error);
                } else {
                    return Promise.resolve(active);
                }
            }).catch((exc) => {
                return Promise.reject(exc);
            });
    } else {
        return Promise.resolve(active);
    }
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
        //newoptions.mode = 'cors';
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
        state.debug('sendSequentially updateCurrentCookie2',
                    state.currentCookie);
        return Promise.resolve(response);
    }

    function mk_invalidate (description) {
        // This function declares the host as unable to answer.
        // Meanwhile, the host may answer with bad status code!
        // We consider 40x status code to be correct (the server answers
        // and the fault is a client fault).
        return function (reason) {
            state.debug('sendSequentially mk_invalidate', reason);
            // With the fetch API, reason is a Response (or Exception):
            if ( typeof Response !== 'undefined' &&
                 reason instanceof Response &&
                 500 <= reason.status ) {
                state.debug('sendAXserver invalidate', description, reason);
                //console.log(reason);
                description.enabled = false;
                description.lastError = reason;
            } else {
                description.enabled = false;
                description.lastError = reason;
            }
            return Promise.reject(reason);
        };
    }
    function send (description) {
        const newoptions = regenerateNewOptions(options);
        newoptions.protocol = newoptions.protocol || 
            description.protocol || state.servers.protocol;
        newoptions.path = newoptions.protocol + '://' +
            description.host + description.prefix + options.path;
        state.debug('sendSequentially send', newoptions);
        return state.userAgent(newoptions)
            .catch(mk_invalidate(description))
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
            if ( reason instanceof Response &&
                 reason.status < 400 &&
                 500 <= reason.status ) {
                state.debug('sendConcurrently seeError', see(reason));
                // Don't consider the absence of a report to be a
                // reason to disable the server.
                description.enabled = false;
                description.lastError = reason;
                //const js = JSON.parse(reason.entity);
            }
            return Promise.reject(reason);
        };
    }

    function send (description) {
        const tryoptions = Object.assign({}, regenerateNewOptions(options));
        tryoptions.path = description.protocol + '://' +
            description.host + description.prefix + options.path;
        state.debug("sendConcurrently send", tryoptions.path);
        return state.userAgent(tryoptions)
            .catch(mk_invalidate(description));
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

/** Convert a Response into an ErrorObject.

    An example of an ErrorObject is {
       kind: "errorAnswer",
       httpcode: 400,
       errcode: "e100",
       reason: "FW4EX e100 bla bla",
       response
    }
    
    @param {Response} 
    @return {RejectedPromise<ErrorObject>}
*/

function catchAnomaly (response) {
    const state = CodeGradX.getCurrentState();
    state.debug('Caught anomaly');
    let result = {
        kind: 'errorAnswer',
        httpcode: response.status,
        reason: '???',
        response
    };
    // entityKind is set by mkUserAgent:
    if ( response.entityKind === 'JSON' ) {
        result = Object.assign({}, result, response.entity);
    }
    return Promise.reject(result);
}    

/** Authenticate the user. This will return a Promise leading to
    some User.

    @param {string} login - real login or email address
    @param {string} password
    @returns {Promise<User>} yields {User} or rejects {ErrorObject}

    Possible error codes:
    - "FW4EX e162b wrongCombination"

    */

CodeGradX.State.prototype.getAuthenticatedUser =
function (login, password) {
  const state = this;
  state.debug('getAuthenticatedUser1', login);
  const params = { login, password };
  //if ( state.currentCampaignName ) {
  //    params.campaign = state.currentCampaignName;
  //}
  return state.sendAXServer('x', {
    path: '/fromp/connect',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    entity: params
  }).then(function (response) {
      if ( response.ok ) {
          //console.log(response);
          state.debug('getAuthenticatedUser2', response);
          state.currentUser = new CodeGradX.User(response.entity);
          return Promise.resolve(state.currentUser);
      } else {
          throw response;
      }
  })
    .catch(catchAnomaly);
};

/** Get current user (if defined). This is particularly useful when
    the user is not authenticated via getAuthenticatedUser() (for
    instance, via GoogleOpenId).

    @param {boolean} force - ask server again
    @return {Promise<User>} yields {User} or undefined

    Possible error codes:
    - "FW4EX e100 unknown person"

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
        state.debug('getWhoAmI2', response);
        if ( response.ok ) {
            //console.log(response);
            state.currentUser = new CodeGradX.User(response.entity);
            // NOTA: whoami lists only active campaigns:
            return Promise.resolve(state.currentUser);
        } else {
            throw response;
        }
    })
        .catch((reason) => {
            state.debug('getCurrentUser2', reason);
            return undefined;
        });
};

/** Disconnect the user.

    @returns {Promise<>} always yields undefined

    Successful JSON answer should be { 
        httpcode: 200, 
        errcode: "e126", 
        reason: "FW4EX e126 disconnected",
        kind: "errorAnswer" }

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

/** Ask for a temporary link to be received by email.

    @param {string} email - real login or email address
    @returns {Promise<>} yields {PartialUser} or rejects {ErrorObject}

    Possible error codes:
    - "e129f4 no such person"

    Attention, the result is only a PartialUser that is,
    { 
      "kind":"authenticationAnswer",
      "token":"TOKEN-reconnect",
      "expires":"2020-12-26T17:24:11",
      "uaversion":1,
      "confirmedua":1,
      "confirmedemail":1,
      "logins":["christian.queinnec@gmail.com", ...],
      "login":"christian.queinnec@gmail.com"
    }

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
        if ( response.ok ) {
            // This is a very incomplete user record:
            state.currentUser = new CodeGradX.User(response.entity);
            return Promise.resolve(state.currentUser);
        } else {
            throw response;
        }
    })
        .catch(catchAnomaly);
};

/** Enroll a new user. 

    @param {string} login - email
    @param {string} captcha - g-captcha-response
    @returns {Promise<User>} yields {User} or rejects {ErrorObject}

    Possible error codes: 
    - "FW4EX e157e missing or bad email"

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
        if ( response.ok ) {
            state.currentUser = new CodeGradX.User(response.entity);
            return Promise.resolve(state.currentUser);
        } else {
            throw response;
        }
    })
        .catch(catchAnomaly);
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
    const allowedKeys =
          ['pseudo', 'email', 'lastname', 'firstname', 'password'];
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

/** Utility: user's campaigns are kept in a hashtable and in an array.
*/

CodeGradX.hash2array = function (o) {
    let result = [];
    Object.keys(o).forEach((key) => {
        result.push(o[key]);
    });
    return result;
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
             x.codegradx.org/constellation/aesx

    -2- get the specialized configuration for the server say
    li101.codegradx.org. This configuration defines the campaign, the
    programming language, the editor, etc. The configuration is held
    on the server itself as
       li101.codegradx.org/config.js
    or on an X server as
      x.codegradx.org/constellation/configuration/li101.codegradx.org.js

      @return Promise<> yielding <State>
*/

CodeGradX.initialize = async function (force=false, initializer) {
    let state = CodeGradX.getCurrentState();
    if ( force || ! state.initialized ) {
        state = new CodeGradX.State(initializer);
        // -1- try the specific host:
        let js = undefined;
        try {
            const hostname = document.location.hostname;
            let configurationName = state.configurationName || hostname;
            js = await state.getCurrentConfiguration1(configurationName);
        } catch (exc) {
            // -2- ask the X server for that specific host:
            state.debug('initialize PB getcurrentconfiguration1', exc);
            try {
                const hostname = document.location.hostname;
                js = await state.getCurrentConfigurationX(hostname);
            } catch (exc) {
                state.debug('initialize PB getcurrentconfigurationX', exc);
            }
        }
        if ( js ) {
            // js should be like "function (CodeGradX) { true; }"
            try {
                const f = window['ev' + 'al'](`(${js})`);
                f(CodeGradX, state);
            } catch (exc) {
                state.debug('initialize PB eval configuration', exc);
            }
        }
        if ( ! state.servers ) {
            // Get the current state of the constellation of a, e, x, s servers:
            try {
                const servers = await state.getCurrentConstellation();
                state.servers = servers;
            } catch (exc) {
                state.debug('initialize PB aesx', exc);
                state.servers = state.defaultservers;
            }
        }
        delete state.defaultservers;
        state.initialized = true;
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
        throw exc;
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
        throw exc;
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
        throw exc;
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

Other possibilities:
   xml2json does not parse CDATA, use node-expat
   xml-js requires sax

Replace xml2js dependency by xml-js!
  exercise.mjs should use parsexml rather than xml2js

So now:

  exercise requires parsexml
   parsexml requires xml-js
     xml-js requires sax
   xml2html requires sax


*/

// end of codegradx.mjs
