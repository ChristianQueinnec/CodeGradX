// webpack to prepare sax, xmlbuilder and xml2js

const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        sax: './node_modules/sax/lib/sax.js',
        xmlbuilder: './node_modules/xmlbuilder/lib/index.js',
        xml2js: './node_modules/xml2js/lib/xml2js.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    optimization: {
        //splitChunks: {
        //    chunks: 'all'
        //}
    }
};
