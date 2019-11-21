// Jasmine test for str2Date


import CodeGradX from '../src/campaign.mjs';

describe('CodeGradX 28 str2Date', function () {

  it("should have a working str2Date", function (done) {
    var string1 = "2001-01-01 05:00:00";
    var date1 = CodeGradX._str2Date(string1);
    expect(date1.getFullYear()).toBe(2001);

    var string1 = "2001-01-01 05:00:00+01";
    var date1 = CodeGradX._str2Date(string1);
    expect(date1.getFullYear()).toBe(2001);

    var string2 = "2032-01-01 04:00:00+01";
    var date2 = CodeGradX._str2Date(string2);
    expect(date2.getFullYear()).toBe(2032);

    var string3 = "2028-01-01T00:00:00";
    var date3 = CodeGradX._str2Date(string3);
    expect(date3.getFullYear()).toBe(2028);

    var string4 = "2027-01-01 00:00:00Z";
    var date4 = CodeGradX._str2Date(string4);
    expect(date4.getFullYear()).toBe(2027);

    var string5 = "2026-01-01T00:00:00Z";
    var date5 = CodeGradX._str2Date(string5);
    expect(date5.getFullYear()).toBe(2026);

    done();
  });

});
