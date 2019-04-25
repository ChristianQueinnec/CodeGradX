// parsexml.js
// Time-stamp: "2019-04-25 17:25:34 queinnec"

import CodeGradX from '../codegradx.mjs';
/** Re-export the `CodeGradX` object */
export default CodeGradX;
import xml2js from '../src/xml2js.mjs';

/** Promisify an XML to Javascript converter.

        @param {string} xml - string to parse
        @returns {Promise}

      */

CodeGradX.parsexml = function (xml) {
  if ( ! xml ) {
    return Promise.reject("Cannot parse XML " + xml);
  }
  const parser = new xml2js.Parser({
    explicitArray: false,
    trim: true
  });
  let xerr, xresult;
  try {
    parser.parseString(xml, function (err, result) {
      xerr = err;
      xresult = result;
    });
  } catch (e) {
    // for a TypeError: Cannot read property 'toString' of undefined
    return Promise.reject(e);
  }
  if ( xerr ) {
    return Promise.reject(xerr);
  } else {
    return Promise.resolve(xresult);
  }
};

// end of parsexml.js
