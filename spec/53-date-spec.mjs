// Jasmine test to check parsing of dates (Safari Date.parse does not
// work as in Chrome).

import { CodeGradX } from '../codegradx.mjs';

describe('CodeGradX 53 date', function () {

    it('should be loaded', function (done) {
        expect(CodeGradX).toBeDefined();
        done();
    });

    // We assume local time to be +02:00
    
    it("handle ymd hms", function () {
        var d = '2001-01-01 01:01:01';
        expect(CodeGradX._str2Date(d).toISOString())
            .toBe('2001-01-01T01:01:01.000Z');
    });
    it("handle ymdThms", function () {
        var d = '2001-01-01T01:01:02';
        expect(CodeGradX._str2Date(d).toISOString())
            .toBe('2001-01-01T01:01:02.000Z');
    });
    
    it("handle ymd hmsZ", function () {
        var d = '2001-01-01 01:01:03Z';
        expect(CodeGradX._str2Date(d).toISOString())
            .toBe('2001-01-01T01:01:03.000Z');
    });
    it("handle ymdThmsZ", function () {
        var d = '2001-01-01T01:01:04Z';
        expect(CodeGradX._str2Date(d).toISOString())
            .toBe('2001-01-01T01:01:04.000Z');
    });
    
    it("handle ymd hms+", function () {
        var d = '2001-01-01 01:01:05+02';
        expect(CodeGradX._str2Date(d).toISOString())
            .toBe('2000-12-31T23:01:05.000Z');
    });
    
});
