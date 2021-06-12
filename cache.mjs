// CodeGradX Caching 
// Time-stamp: "2021-06-12 16:33:31 queinnec"

import { CodeGradX as cx } from 'codegradx';
export const CodeGradX = cx;

export function plugCache (CodeGradX, type, state) {
    state.cacherType = type;

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
        /** No Cache at all. Caching is done by service-worker.
            Definition of NoCache appears in codegradx.mjs */
        return CodeGradX.NoCache;
    }

    if ( type === 'InlineCache' ) {
        /** Inline Cache. Cached values are stored in memory.  */

        CodeGradX.InlineCache = function InlineCache () {
            this.type = type;
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

        CodeGradX.InlineCache.prototype.keys = function () {
            const cache = this;
            const keys = [];
            for ( const key of cache._map.keys() ) {
                keys.push(key);
            }
            return keys;
        };

        /* 
           This function is the same for all types of caches:

           handler() = clear()
           handler(key) = get(key)
           handler(key, thing) = set(key, thing)
         */
        CodeGradX.InlineCache.prototype.handler =
            CodeGradX.NoCache.prototype.handler;
        return CodeGradX.InlineCache;
    }

    if ( type === 'LocalStorageCache' ) {
        /** Local Storage Cache. */

        CodeGradX.LocalStorageCache = function LocalStorageCache (kind) {
            if ( typeof window !== 'undefined' && window.localStorage ) {
                this.kind = kind;
                this.type = type;
            } else {
                //throw `LocalStorage not available!`;
                state.cacherType = 'InlineCache';
                return new CodeGradX[state.cacherType]();
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

        CodeGradX.LocalStorageCache.prototype.keys = function () {
            const cache = this;
            const keys = [];
            for ( let i=0 ; i<localStorage.length ; i++ ) {
                const key = localStorage.key(i);
                if ( key.startsWith(`${cache.kind}:`) ) {
                    keys.push(key.replace(/^[^:]+:/, ''));
                }
            }
            return keys;
        };

        /** Utility function to clear, get or set a Cache instance. Every
            value is turned into a String (this process is possibly customized
            with a jsonize method.
        */

        CodeGradX.LocalStorageCache.prototype.handler = 
            CodeGradX.NoCache.prototype.handler;
        return CodeGradX.LocalStorageCache;
    }

}

// end of cache.mjs
