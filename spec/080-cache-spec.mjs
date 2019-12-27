// Jasmine tests for caches

import CodeGradX from '../codegradx.mjs';

describe('080 cache', function () {

    it('should be loaded', function () {
        expect(CodeGradX.State).toBeDefined();
    });

    it("using job cache", function () {
        const state = new CodeGradX.State();
        state.cachedStuff = CodeGradX.mkInlineCacheFor('stuff');
        state.cachedStuff('a', 11);
        state.cachedStuff('b', 12);
        expect(state.cachedStuff('a')).toBe(11);
        expect(state.cachedStuff('b')).toBe(12);
        state.cachedStuff('b', 122);
        expect(state.cachedStuff('b')).toBe(122);
        state.cachedStuff();
        expect(state.cachedStuff('a')).not.toBeDefined();
        expect(state.cachedStuff('b')).not.toBeDefined();
    });

    it("seeing innards", function () {
        const state = new CodeGradX.State();
        expect(state.cache.stuff).not.toBeDefined();
        state.cachedStuff = CodeGradX.mkInlineCacheFor('stuff');
        state.cachedStuff('a', 22);
        expect(state.cache.stuff instanceof Map).toBeTruthy();
        expect(state.cache.stuff.get('a')).toBe(22);
    });

    it("json checks", function () {
        const state = new CodeGradX.State();
        expect(state.cache.stuff).not.toBeDefined();
        state.cachedStuff = CodeGradX.mkInlineCacheFor('stuff');
        state.cachedStuff('aa', {a: 1, b: 2});
        expect(state.cachedStuff('aa').a).toBe(1);
        expect(state.cachedStuff('aa').b).toBe(2);
        expect(state.cache.stuff.get('aa')).toMatch(/^JSON:/);
    });

});
