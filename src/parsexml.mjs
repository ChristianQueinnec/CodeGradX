// parsexml.js
// Time-stamp: "2021-02-11 15:07:58 queinnec"

import { CodeGradX } from 'codegradx';
//import xml2js from 'codegradx/src/xml2js';
//import xml2js from 'xml2js';
//const xml2js = require('xml2js');
//const convert = require('../src/xml2js.js');
import convert from 'codegradx/src/xml2js';

/** Promisify an XML to Javascript converter.

        @param {string} xml - string to parse
        @returns {Promise}

*/

export function parsexml (xml) {
    const options = {
        ignoreComment: true,
        ignoreInstruction: true,
        ignoreDoctype: true,
        ignoreDeclaration: true
    };
    try {
        const result = convert.xml2js(xml, options);
        return Promise.resolve(result);
    } catch (exc) {
        return Promise.reject(exc);
    }
}

/* 
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
*/

CodeGradX.parsexml = parsexml;

// end of parsexml.js
