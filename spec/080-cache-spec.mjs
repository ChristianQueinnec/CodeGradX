// Jasmine tests for caches

import CodeGradX from '../codegradx.mjs';

describe('080 cache', function () {

    function cached (kind, key, thing) {
        return CodeGradX.mkCacheFor(thing)(key, thing);
    }

    it('should be loaded', function () {
        expect(CodeGradX.State).toBeDefined();
    });

    it("using job cache", function () {
        const state = new CodeGradX.State();
        state.cachedJob('a', 11);
        expect(state.cachedJob('a', 11) instanceof Map).toBeTruthy();
        state.cachedJob('b', 12);
        expect(state.cachedJob('a')).toBe(11);
        expect(state.cachedJob('b')).toBe(12);
        state.cachedJob('b', 122);
        expect(state.cachedJob('b')).toBe(122);
        state.cachedJob();
        expect(state.cachedJob('a')).not.toBeDefined();
        expect(state.cachedJob('b')).not.toBeDefined();
    });

    it("seeing innards", function () {
        const state = new CodeGradX.State();
        expect(state.cache.job).not.toBeDefined();
        state.cachedJob('a', 22);
        expect(state.cache.job instanceof Map).toBeTruthy();
        expect(state.cache.job.get('a')).toBe(22);
    });

});
