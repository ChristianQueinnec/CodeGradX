// CodeGradX Caching 
// Time-stamp: "2021-02-26 16:38:55 queinnec"

export function plugCache (CodeGradX, type) {

    /** Cache interface. It may clear, get or set the cache. All these
        functionalities are gathered in one method of State named cachedX.
        
        state.cachedX()            -- clears the cache
        state.cachedX(key)         -- returns X with key
        state.cachedX(key, value)  -- insert key=>value into cache

    */

    CodeGradX.State.prototype.mkCacheFor = function (kind) {
        const state = this;
        if ( ! state.caches ) {
            state.caches = new Object({});
        }
        const builder = state.cacher;
        const cache = new builder(kind);
        state.caches[kind] = cache;
        state[`cached${kind}`] = cache.handler.bind(cache);
    };

    function searchInCache (key, thing) {
        const cache = this;
        if ( key ) {
            if ( thing ) {
                return cache.set(key, thing);
            } else {
                return cache.get(key);
            }
        } else {
            return cache.clear();
        }
    }

    /** Utility function that builds a new stringified Object from thing
        with the keys.
    
        @params Object thing - the object to partially clone
        @params Array<String> keys - the keys to clone
        @returns JSONstring
    */
    
    CodeGradX.jsonize = function (thing, keys) {
        const o = {'--t': Date.now()};
        for (let key of keys) {
            let value = thing[key];
            if ( value ) {
                o[key] = thing[key];
            }
        }
        return JSON.stringify(o);
    };

    if ( type === 'NoCache' ) {
        /** No Cache at all. Caching is done by service-worker */

        CodeGradX.NoCache = function () {
            // constructor!
        };
        CodeGradX.NoCache.prototype.clear = function () {
            return true;
        };
        CodeGradX.NoCache.prototype.get = function (key) {
            /*eslint no-unused-vars: ["error", { "args": "none" }]*/
            return undefined;
        };
        CodeGradX.NoCache.prototype.set = function (key, thing) {
            /*eslint no-unused-vars: ["error", { "args": "none" }]*/
            return thing;
        };
        CodeGradX.NoCache.prototype.handler = searchInCache;
        return CodeGradX.NoCache;
    }

    if ( type === 'InlineCache' ) {
        /** Inline Cache. Cached values are stored in memory.  */

        CodeGradX.InlineCache = function () {
            this._map = new Map();
        };

        CodeGradX.InlineCache.prototype.clear = function () {
            const cache = this;
            return cache._map.clear();
        };

        CodeGradX.InlineCache.prototype.get = function (key) {
            const cache = this;
            return cache._map.get(key);
        };

        CodeGradX.InlineCache.prototype.set = function (key, thing) {
            const cache = this;
            cache._map.set(key, thing);
            return thing;
        };

        CodeGradX.InlineCache.prototype.handler = searchInCache;
        return CodeGradX.InlineCache;
    }

    if ( type === 'LocalStorageCache' ) {
        /** Local Storage Cache. */

        CodeGradX.LocalStorageCache = function (kind) {
            if ( typeof window !== 'undefined' && window.localStorage ) {
                this.kind = kind;
            } else {
                throw `LocalStorage not available!`;
            }
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
            const state = CodeGradX.getCurrentState();
            const JSONprefix = 'JSON:';
            
            key = `${cache.kind}:${key}`;
            let newthing = localStorage.getItem(key);
            if ( typeof newthing === 'string' ) {
                try {
                    if ( newthing.match(`^${JSONprefix}`) ) {
                        const s = newthing.slice(JSONprefix.length);
                        const o = JSON.parse(s);
                        return o;
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
            
        };

        CodeGradX.LocalStorageCache.prototype.set = function (key, thing) {
            const cache = this;
            const state = CodeGradX.getCurrentState();
            const JSONprefix = 'JSON:';

            try {
                let newthing = undefined;
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

                key = `${cache.kind}:${key}`;
                try {
                    localStorage.setItem(key, newthing);
                } catch (_) {
                    // Probably a QuotaExceededError
                    // remove oldest keys ???
                    cache.clear();
                }

            } catch (_) {
                // ignore, thing is not cached!
            }
            
            return thing;
        };

        /** Utility function to clear, get or set a Cache instance. Every
            value is turned into a String (this process is possibly customized
            with a jsonize method.
        */

        CodeGradX.LocalStorageCache.prototype.handler = searchInCache;
        return CodeGradX.LocalStorageCache;
    }

}

// end of cache.mjs
