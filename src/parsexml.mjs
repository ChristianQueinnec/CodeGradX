// parsexml.js
// Time-stamp: "2019-05-20 18:18:42 queinnec"

import CodeGradX from '../codegradx.mjs';
import xml2js from '../src/xml2js.mjs';

/** Promisify an XML to Javascript converter.

        @param {string} xml - string to parse
        @returns {Promise}

      */

export function parsexml (xml) {
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
}
CodeGradX.parsexml = parsexml;

// end of parsexml.js
