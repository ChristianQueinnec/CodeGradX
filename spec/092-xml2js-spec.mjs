// Jasmine tests for public interactions

import { CodeGradX } from '../codegradx.mjs';
import { xml2js } from '../src/xml2js.mjs';

describe('xml2js', function () {

    it('should be loaded', function () {
        expect(xml2js).toBeDefined();
        expect(typeof xml2js).toBe('function');
        console.log({xml2js});
    });

});
