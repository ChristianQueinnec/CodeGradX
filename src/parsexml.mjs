// parsexml.js
// Time-stamp: "2021-09-15 14:39:27 queinnec"

import { CodeGradX } from '../codegradx.mjs';
//import xml2js from 'codegradx/src/xml2js';
//import xml2js from 'xml2js';
//const xml2js = require('xml2js');
//const convert = require('../src/xml2js.js');
import { xml2js } from './xml2js.mjs';

/** Promisify an XML to Javascript converter.

        @param {string} xml - string to parse
        @returns {Promise}

*/

export function parsexml (xml) {
    const options = {
        compact: true,
        trim: true,
        ignoreComment: true,
        ignoreInstruction: true,
        ignoreDoctype: true,
        ignoreDeclaration: true
    };
    try {
        let result = xml2js(xml, options);
        result = convert_(result);
        return Promise.resolve(result);
    } catch (exc) {
        return Promise.reject(exc);
    }
}

/**
   xml-js names $ as _attributes and _ as _text so convert these names
   back to what xml2js used.
 */

function convert_ (o) {
    if ( typeof o === 'object' ) {
        const keys = Object.keys(o);
        for ( let key of keys ) {
            if ( key === '_text' ) {
                o._ = o._text;
                delete o._text;
                key = '_';
            } else if ( key === '_attributes' ) {
                o.$ = o._attributes;
                delete o._attributes;
                key = '$';
            }
            o[key] = convert_(o[key]);
        }
        if ( keys.length === 1 &&
             keys[0] === '_text' ) {
            return o._;
        } else {
            return o;
        }
    } else if ( Array.isArray(o) ) {
        return o.map(convert_);
    } else {
        return o;
    }
}

CodeGradX.parsexml = parsexml;

// end of parsexml.js
