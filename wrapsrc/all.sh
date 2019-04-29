#! /bin/bash
# Time-stamp: "2019-04-23 09:02:39 queinnec"

MODE=production
MODE=development

./node_modules/.bin/webpack \
    --context . \
    --config wrapsrc/webpack.all.config.js \
    --mode ${MODE} \
     --optimize-minimize 
ls -tl wrapsrc/dist/

for name in sax xmlbuilder xml2js
do {
    echo "export default "
    cat wrapsrc/dist/${name}.bundle.js
    } > src/${name}.mjs
done

# end of all.sh
