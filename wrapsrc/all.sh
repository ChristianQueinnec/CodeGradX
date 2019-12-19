#! /bin/bash
# Time-stamp: "2019-12-18 18:55:53 queinnec"

MODE=${MODE:-production}
#MODE=development

./node_modules/.bin/webpack \
    --context . \
    --config wrapsrc/webpack.all.config.js \
    --mode ${MODE} \
     --optimize-minimize 
ls -tl wrapsrc/dist/

if [ "$MODE" = 'development' ]
then
    for name in sax xmlbuilder xml2js
    do {
        echo "export default "
        cat wrapsrc/dist/${name}.bundle.js
    } > src/${name}.mjs
    done
else
    for name in sax xmlbuilder xml2js
    do {
        echo "let __r =" ; echo "//" 
        tail --bytes=+2 wrapsrc/dist/${name}.bundle.js | \
            sed -e 's@}n.m=@} return n.m=@'
        echo ; echo "//" ; echo "export default (__r);"
    } > src/${name}.mjs
    done
fi

# end of all.sh
