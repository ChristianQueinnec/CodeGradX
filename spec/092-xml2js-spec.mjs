// Jasmine tests for public interactions

import CodeGradX from '../codegradx.mjs';

import xml2js from '../src/xml2js.mjs';

describe('xml2js', function () {

    it('should be loaded', function () {
        expect(xml2js).toBeDefined();
        console.log(xml2js);
        expect(xml2js.parseString).toBeDefined();
    });

});
