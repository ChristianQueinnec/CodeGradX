// Jasmine test related to the conversion of xml towards javascript.

import { CodeGradX } from '../codegradx.mjs';
import { parsexml } from '../src/parsexml.mjs';

describe('CodeGradX 60 xml2js', function () {

  it("converts xml to js", function (done) {
    function faildone (reason) {
      state.debug('faildone', reason).show();
      fail(reason);
      done();
    }
    var xml1 = "<a aa='bb' cc='1'></a>";
    CodeGradX.parsexml(xml1).then(function (js) {
      //console.log(js);
      expect(js.a.$.aa).toBe('bb');
      expect(js.a.$.cc).toBe('1');
      done();
    }, faildone);
    var xml2 = "<a aa='bb' cc='1' />";
    CodeGradX.parsexml(xml2).then(function (js) {
      //console.log(js);
      expect(js.a.$.aa).toBe('bb');
      expect(js.a.$.cc).toBe('1');
      done();
    }, faildone);
  });

});
