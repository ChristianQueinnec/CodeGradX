// Jasmine tests for caches

import CodeGradX from '../codegradx.mjs';

describe('080 cache', function () {

    it('should be loaded', function () {
        expect(CodeGradX.State).toBeDefined();
    });

    it("using stuff cache", function () {
        const state = new CodeGradX.State();
        state.mkCacheFor('Stuff');
        state.cachedStuff('a', 11);
        state.cachedStuff('b', 12);
        expect(state.cachedStuff('a')).toBe(11);
        expect(state.cachedStuff('b')).toBe(12);
        // modify cache:
        state.cachedStuff('b', 122);
        expect(state.cachedStuff('b')).toBe(122);
        // clear cache:
        state.cachedStuff();
        expect(state.cachedStuff('a')).not.toBeDefined();
        expect(state.cachedStuff('b')).not.toBeDefined();
    });

    it("seeing innards", function () {
        const state = new CodeGradX.State();
        expect(state.cache.stuff).not.toBeDefined();
        state.mkCacheFor('Stuff');
        state.cachedStuff('a', 22);
        expect(state.cache.Stuff.get('a')).toBe('{"_":22}');
    });

    it("json checks", function () {
        const state = new CodeGradX.State();
        state.mkCacheFor('Stuff');
        state.cachedStuff('aa', {a: 1, b: 2});
        expect(state.cachedStuff('aa').a).toBe(1);
        expect(state.cachedStuff('aa').b).toBe(2);
        expect(state.cache.Stuff.get('aa')).toMatch(/^JSON:/);
    });

    it("weird values" , function () {
        const state = new CodeGradX.State();
        state.mkCacheFor('Stuff');
        // ignore functions:
        state.cachedStuff('bb', Math.max);
        // However bb is bound to "{}"
        //console.log(state.log);
        //console.log(state.cache.stuff);
        expect(state.cachedStuff('bb')).not.toBeDefined();
        // ignore undefined (cc will not be cached):
        state.cachedStuff('cc', undefined);
        expect(state.cachedStuff('cc')).not.toBeDefined();
        // ignore NaN (dd will not be cached):
        state.cachedStuff('dd', NaN);
        //console.log(state.log);
        console.log(state.cache.Stuff);
        expect(state.cachedStuff('dd')).not.toBeDefined();
        // clear Stuff
        state.cachedStuff();
        expect(state.cachedStuff('b')).not.toBeDefined();
        expect(state.cachedStuff('bb')).not.toBeDefined();
        expect(state.cachedStuff('aa')).not.toBeDefined();
    });

    it("gc", function () {
        const state = new CodeGradX.State();
        state.mkCacheFor('Stuff');
        state.cachedStuff('a', 222);
        expect(state.cachedStuff('a')).toBe(222);
        state.gc();
        state.mkCacheFor('Stuff');
        expect(state.cachedStuff('a')).not.toBeDefined();
    });

});
