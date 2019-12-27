// Jasmine tests for caches

import CodeGradX from '../codegradx.mjs';

describe('080 cache', function () {

    it('should be loaded', function () {
        expect(CodeGradX.State).toBeDefined();
    });

    it("using job cache", function () {
        const state = new CodeGradX.State();
        const cachedThing = CodeGradX.mkInlineCacheFor('stuff');
        state.cachedThing = cachedThing;
        state.cachedThing('a', 11);
        state.cachedThing('b', 12);
        expect(state.cachedThing('a')).toBe(11);
        expect(state.cachedThing('b')).toBe(12);
        state.cachedThing('b', 122);
        expect(state.cachedThing('b')).toBe(122);
        state.cachedThing();
        expect(state.cachedThing('a')).not.toBeDefined();
        expect(state.cachedThing('b')).not.toBeDefined();
    });

    it("seeing innards", function () {
        const state = new CodeGradX.State();
        expect(state.cache.stuff).not.toBeDefined();
        const cachedThing = CodeGradX.mkInlineCacheFor('stuff');
        state.cachedThing = cachedThing;
        state.cachedThing('a', 22);
        expect(state.cache.stuff instanceof Map).toBeTruthy();
        expect(state.cache.stuff.get('a')).toBe(22);
    });

});
