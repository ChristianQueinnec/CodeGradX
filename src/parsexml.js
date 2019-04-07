// parsexml.js
// Time-stamp: "2019-04-07 10:18:08 queinnec"

module.exports = function (CodeGradX) {
    const xml2js = require('xml2js');

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

};

// end of parsexml.js
