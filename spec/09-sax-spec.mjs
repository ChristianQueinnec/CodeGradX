// Jasmine tests for public interactions

import CodeGradX from '../codegradx.mjs';

import sax from '../src/sax.mjs';

describe('sax', function () {

    it('should be loaded', function () {
        expect(sax).toBeDefined();
        expect(sax.parser).toBeDefined();
        console.log(sax);
    });

});
