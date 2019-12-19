// webpack to prepare sax, xmlbuilder and xml2js

const path = require('path');

module.exports = {
    mode: process.env.MODE,
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

/*   MODE=environment
bash wrapsrc/all.sh
Hash: ab26f73f426f8c069619
Version: webpack 4.30.0
Time: 675ms
Built at: 12/18/2019 2:44:04 PM
               Asset     Size      Chunks             Chunk Names
       sax.bundle.js  241 KiB         sax  [emitted]  sax
    xml2js.bundle.js  360 KiB      xml2js  [emitted]  xml2js
xmlbuilder.bundle.js   99 KiB  xmlbuilder  [emitted]  xmlbuilder
Entrypoint sax = sax.bundle.js
Entrypoint xmlbuilder = xmlbuilder.bundle.js
Entrypoint xml2js = xml2js.bundle.js
[0] util (ignored) 15 bytes {sax} {xml2js} [built]
[1] util (ignored) 15 bytes {sax} {xml2js} [built]
[./node_modules/webpack/buildin/global.js] (webpack)/buildin/global.js 472 bytes {sax} {xml2js} [built]
    + 57 hidden modules
total 708
-rw-r--r-- 1 queinnec queinnec 247262 Dec 18 14:44 sax.bundle.js
-rw-r--r-- 1 queinnec queinnec 368762 Dec 18 14:44 xml2js.bundle.js
-rw-r--r-- 1 queinnec queinnec 101357 Dec 18 14:44 xmlbuilder.bundle.js


   MODE=production
bash wrapsrc/all.sh
Hash: 095870b2c4c0cc4b1d20
Version: webpack 4.30.0
Time: 4577ms
Built at: 12/18/2019 2:53:44 PM
               Asset      Size   Chunks             Chunk Names
       sax.bundle.js  82.3 KiB        0  [emitted]  sax
    xml2js.bundle.js   132 KiB  1, 0, 2  [emitted]  xml2js
xmlbuilder.bundle.js  40.9 KiB        2  [emitted]  xmlbuilder
Entrypoint sax = sax.bundle.js
Entrypoint xmlbuilder = xmlbuilder.bundle.js
Entrypoint xml2js = xml2js.bundle.js
 [3] (webpack)/buildin/global.js 472 bytes {0} {1} [built]
[40] util (ignored) 15 bytes {0} {1} [built]
[42] util (ignored) 15 bytes {0} {1} [built]
    + 57 hidden modules
total 260
-rw-r--r-- 1 queinnec queinnec 134692 Dec 18 14:53 xml2js.bundle.js
-rw-r--r-- 1 queinnec queinnec  41915 Dec 18 14:53 xmlbuilder.bundle.js
-rw-r--r-- 1 queinnec queinnec  84314 Dec 18 14:53 sax.bundle.js

*/

