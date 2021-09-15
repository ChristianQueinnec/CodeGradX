// Jasmine tests for public interactions

import { CodeGradX } from '../codegradx.mjs';

import xmlbuilder from '../src/xmlbuilder.mjs';

describe('xmlbuilder', function () {

    it('should be loaded', function () {
        expect(xmlbuilder).toBeDefined();
        expect(xmlbuilder.create).toBeDefined();
        console.log(xmlbuilder);
    });

});
