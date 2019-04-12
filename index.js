// CodeGradX
// Time-stamp: "2019-04-12 18:24:49 queinnec"

/** Javascript Library to interact with the CodeGradX infrastructure.

## Description

In order to remain small, this library contains a number of autoload
functions. It must be initialized with a name so it may fetch the
configuration associated with that name if it exists otherwise the
default configuration is used.

## Usage

This library makes a huge usage of promises as may be seen in the following
use case:

```javascript
// Example of use:
const CodeGradX = require('codegradx');
CodeGradX.getCurrentState().initialize('someHostName');

```

*/

const CodeGradX = {};

/** Export the `CodeGradX` object */
module.exports = CodeGradX;
//export default CodeGradX;

//const _    = require('lodash');
const _ = (function () {
    const isFunction = require('lodash/isFunction');
    const forEach = require('lodash/forEach');
    const isNumber = require('lodash/isNumber');
    const memoize = require('lodash/memoize');
    const forIn = require('lodash/forIn');
    const has = require('lodash/has');
    const filter = require('lodash/filter');
    const map = require('lodash/map');
    const reduce = require('lodash/reduce');
    return { isFunction, forEach, isNumber, memoize, forIn,
             has, filter, map, reduce };
})();

// Avoid depending on 'when' or 'bluebird', just define those utilities
// and add them to native Promises.
//const when = require('when');
const when = {
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
const rest = require('rest');
const mime = require('rest/interceptor/mime');
const registry = require('rest/mime/registry');
const util = require('util'); // used by Log.debug

CodeGradX.when = when;
CodeGradX.rest = rest;
CodeGradX.util = util;
CodeGradX._ = _;
Promise.prototype.timeout = function (delay) {
    return when.timeout(this, delay);
};
Promise.prototype.delay = function (delay) {
    return when.delay(this, delay);
};

// Define that additional MIME type:
registry.register('application/octet-stream', {
    read: function(str) {
        return str;
    },
    write: function(str) {
        return str;
    }
});

/* Are we running under Node.js */
CodeGradX.isNode = _.memoize(
    // See http://stackoverflow.com/questions/17575790/environment-detection-node-js-or-browser
    function _checkIsNode () {
        /*jshint -W054 */
        const code = "try {return this===global;}catch(e){return false;}";
        const f = new Function(code);
        return f();
    });


// ******************** General utilities *********************

CodeGradX._str2num = function (str) {
  if (!isNaN(str)) {
    str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
  }
  return str;
};

CodeGradX._str2num2decimals = function (str) {
    const scale = 100; // Leave two decimals
    if ( _.isNumber(str) ) {
        return (Math.round(scale * str))/scale;
    } else if ( ! isNaN(str) ) {
        if ( str % 1 === 0 ) {
            return parseInt(str, 10);
        } else {
            let x = parseFloat(str);
            return (Math.round(scale * x))/scale;
        }
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

/** Log some facts. The facts (the arguments) will be concatenated
    (with a separating space) to form a string to be recorded in the log.

    @method CodeGradX.Log.debug
    @param {Value} arguments - facts to record
    @returns {Log}
    @lends CodeGradX.Log.prototype
    @alias module:codegradxlib.debug
    */

CodeGradX.Log.prototype.debug = function () {
  // Separate seconds from milliseconds:
  let msg = (''+Date.now()).replace(/(...)$/, ".$1") + ' ';
  for (let i=0 ; i<arguments.length ; i++) {
    if ( arguments[i] === null ) {
      msg += 'null ';
    } else if ( arguments[i] === undefined ) {
      msg += 'undefined ';
    } else {
      msg += util.inspect(arguments[i], { depth: 2 }) + ' ';
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
    this.userAgent = rest.wrap(mime);
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
    if ( _.isFunction(initializer) ) {
        state = initializer.call(state, state);
    }
    // Make the state global
    CodeGradX.getCurrentState = function () {
        return state;
    };
    return state;
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
    description.enabled = (response.status.code < 300);
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
  if ( state.currentCookie ) {
      if ( ! request.headers ) {
          request.headers = {};
      }
      // To send this header imposes a pre-flight:
      //if ( kind !== 's' ) {
      //    request.headers['X-FW4EX-Cookie'] = state.currentCookie;
      //}
      if ( CodeGradX.isNode() ) {
          request.headers.Cookie = state.currentCookie;
      } else {
          if ( ! document.cookie.indexOf(state.currentCookie) ) {
              document.cookie = state.currentCookie + ";path='/';";
          }
      }
  }
  if ( kind !== 's' ) {
      request.mixin = {
          withCredentials: true
      };
  }
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
    function filterDefined (array) {
        const result = [];
        array.forEach(function (item) {
            if ( item ) {
                result.push(item);
            }
        });
        return result;
    }
    state.debug("getActiveServers Possible:", kind,
                filterDefined(_.map(descriptions, 'host')));
    // _.filter leaves 'undefined' values in the resulting array:
    let active = filterDefined(_.filter(descriptions, {enabled: true}));
    state.debug('getActiveServers Active:', kind,
                _.map(active, 'host'));
    if ( active.length === 0 ) {
        // check again all servers:
        return state.checkServers(kind)
            .then(function (descriptions) {
                active = filterDefined(_.filter(descriptions, {enabled: true}));
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
    A good HTTP response has a return code less than 400.

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
  const state = CodeGradX.getCurrentState();
  state.debug('checkStatusCode1', response);
  //console.log(response);
    /* eslint no-control-regex: 0 */
  const reasonRegExp = new RegExp("^(.|\n)*<reason>((.|\n)*)</reason>(.|\n)*$");
  function extractFW4EXerrorMessage (response) {
    let reason;
    const contentType = response.headers['Content-Type'];
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
  if ( response.status &&
       response.status.code &&
       response.status.code >= 400 ) {
      const msg = "Bad HTTP code " + response.status.code + ' ' +
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
        if ( state.currentCookie ) {
            //newoptions.headers['X-FW4EX-Cookie'] = state.currentCookie;
            if ( CodeGradX.isNode() ) {
                newoptions.headers.Cookie = state.currentCookie;
            } else {
                if ( ! document.cookie.indexOf(state.currentCookie) ) {
                    document.cookie = state.currentCookie + ";path='/';";
                }
            }
        }
        return newoptions;
    }

    function updateCurrentCookie (response) {
        //console.log(response.headers);
        //console.log(response);
        state.debug('sendSequentially updateCurrentCookie', response);
        function extractCookie (tag) {
            if ( response.headers[tag] ) { // char case ?
                let cookies = response.headers[tag];
                cookies = _.map(cookies, function (s) {
                    return s.replace(/;.*$/, '');
                });
                cookies = _.filter(cookies, function (s) {
                    s = s.replace(/^u=/, '');
                    return /^U/.exec(s);
                });
                return (state.currentCookie = cookies);
            }
        }
        if ( ! extractCookie('Set-Cookie') ) {
            extractCookie('X-CodeGradX-Cookie');
        }
        return Promise.resolve(response);
    }

    function mk_invalidate (description) {
        // This function declares the host as unable to answer.
        // Meanwhile, the host may answer with bad status code!
        return function (reason) {
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
        newoptions.mixin = {
            withCredentials: true
        };
        state.debug('sendSequentially send', newoptions.path);
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
        if ( state.currentCookie ) {
            //newoptions.headers['X-FW4EX-Cookie'] = state.currentCookie;
            if ( CodeGradX.isNode() ) {
                newoptions.headers.Cookie = state.currentCookie;
            } else {
                if ( ! document.cookie.indexOf(state.currentCookie) ) {
                    document.cookie = state.currentCookie + ";path='/';";
                }
            }
        }
        if ( kind === 'e' ) {
            newoptions.mixin = {
                withCredentials: true
            };
        }
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
                    kind, _.map(aresult, 'host'));
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
  if ( _.has(json, 'campaigns') ) {
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
    this.exercises = _.map(json, processItem);
  } else {
    // initialize optional title, prologue, epilogue:
    Object.assign(this, json);
    this.exercises = _.map(json.exercises, processItem);
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

/** An implementation of require using dynamic load. 
    loadrequire returns a promise that yields the module.exports 
    value of the module.
    
    @param {String} modulename
    @returns Promise<Object> yields the exports object

    Modules are kept on the server within the extras/ directory.

*/

CodeGradX.loadrequire = function (file, options={ port: 80 }) {
    const state = CodeGradX.getCurrentState();
    if ( CodeGradX.loadrequire.cache[file] ) {
        state.debug('loadrequire0 cached', file);
        return Promise.resolve(CodeGradX.loadrequire.cache[file]);
    }
    state.debug('loadrequire1', file);
    return state.userAgent({
        path: `/extras/${file}`,
        method: 'GET',
        port: options.port,
        headers: {
            'Accept': 'application/javascript',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        //console.log(response);
        state.debug('loadrequire2', response);
        if ( response.status.code >= 400 ) {
            throw new Error(`Missing module ${file} (${response.status.code}`);
        }
        const js = response.entity;
        let result;
        let module = {};
        try {
            result = new Function ('require', 'module', js);
            result(CodeGradX.cachedrequire, module);
            if ( module.exports ) {
                CodeGradX.loadrequire.cache[file] = module.exports;
                return Promise.resolve(module.exports);
            } else {
                throw new Error(`Missing module.exports in ${file}`);
            }
        } catch (exc) {
            state.debug('loadrequire3', exc);
            throw exc;
        }
    }).catch(exc => {
        state.debug('loadrequire4', exc);
        return Promise.reject(exc);
    });
};
CodeGradX.loadrequire.cache = {};

/** 
    Load from cache and directly returns the exports value.
    Throw an error if the module is not yet in cache.

    @param {String} filename
    @returns {Object} exports

*/

CodeGradX.cachedrequire = function (file) {
    const state = CodeGradX.getCurrentState();
    if ( CodeGradX.loadrequire.cache[file] ) {
        state.debug('cachedrequire0 cached', file);
        return CodeGradX.loadrequire.cache[file];
    } else {
        throw new Error(`Uncached module ${file}`);
    }
};

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
    function load (file) {
        state.debug('autoload1', file);
        return state.userAgent({
            path: `/extras/${file}`,
            method: 'GET',
            headers: {
                'Accept': 'application/javascript',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(function (response) {
            //console.log(response);
            state.debug('autoload2', response);
            const js = response.entity;
            let result;
            try {
                result = new Function ('require', 'module', js);
                /* eslint no-inner-declarations: 0 */
                function newrequire (word) {
                    if ( word === 'codegradx' ) {
                        return CodeGradX;
                    // These other modules should also be dynamically loaded!!!
                    } else if ( word === 'xml2js' ) {
                        return require('xml2js');
                    } else if ( word === 'sax' ) {
                        return require('sax');
                    } else {
                        throw new Error(`require(${word}) not defined!`);
                    }
                }
                let module = {};
                result(newrequire, module);
                return module.exports(CodeGradX);
            } catch (exc) {
                throw exc;
            }
        }).catch(function (exc) {
            state.debug('autoload3', exc);
            throw new Error(`autoload function ${file} not ready`);
        });
    }
    for ( let klass in autoloads ) {
        if ( typeof autoloads[klass] === 'string' ) {
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
                        return Promise.reject(new Error(`Bad autoload for ${file}`));
                    }
                }).catch((exc) => {
                    state.debug('Autoload3', klass, exc);
                    throw exc;
                });
            };
            CodeGradX[klass] = loader;
        } else {
            for ( let name in autoloads[klass] ) {
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
                            return Promise.reject(new Error(`Bad autoloads for ${name} and ${file}`));
                        }
                    }).catch(function (exc) {
                        state.debug('Autoloads3', exc);
                        throw exc;
                    });
                };
                CodeGradX[klass].prototype[name] = loader;
            }
        }
    }
};

CodeGradX.autoloads = {
    xml2html: 'xml2html.js',
    parsexml: 'parsexml.js',
    State: {
        userGetLink: 'userGetLink.js',
        userEnroll:  'userEnroll.js'
    },
    User: {
        getCampaigns: 'campaign.js',
        getCampaign: 'campaign.js',
        getCurrentCampaign: 'campaign.js',
        getProgress: 'userlib.js',
        getAllJobs: 'userlib.js',
        getAllExercises: 'userlib.js'
    },
    Campaign: {
        getExercisesSet: 'campaignlib.js',
        getExercise: 'campaignlib.js',
        getExercises: 'campaignlib.js',
        getJobs: 'campaignlib.js',
        getSkills: 'campaignlib.js',
        getBatches: 'campaignlib.js',
        getCampaignStudentJobs: 'campaignlib.js'
    },
    Exercise: {
        getDescription: 'exercise.js',
        getEquipmentFile: 'exercise.js',
        sendStringAnswer: 'exercise.js',
        sendFileFromDOM: 'exercise.js',
        sendBatchFromDOM: 'exercise.js',
        getExerciseReport: 'exercise.js',
        getBaseURL: 'exercise.js',
        getExerciseReportURL: 'exercise.js',
        getTgzURL: 'exercise.js'
    },
    ExercisesSet: {
        getExercise: 'exercisesSet.js',
        getExerciseByName: 'exercisesSet.js',
        getExerciseByIndex: 'exercisesSet.js',
    },
    Job: {
        getReport: "job.js",
        getProblemReport: "job.js",
        getReportURL: "job.js",
        getProblemReportURL: "job.js",
        getTgzURL: "job.js"
    },
    Batch: {
        getReport: 'batch.js',
        getFinalReport: 'batch.js',
        getReportURL: 'batch.js'
    }
};

// end of index.js
