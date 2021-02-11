# Time-stamp: "2021-02-11 18:45:52 queinnec"

work : nothing 
clean :: 
	-rm *~ src/*~ spec/*~

lint :
	node_modules/.bin/eslint *.mjs *.js
#src/[cejpu]*.mjs
#src/*.mjs

prepare : src/sax.mjs src/xml2js.mjs src/options-helper.js prepare.modules

# Modify modules to avoid:
#   require('stream') which is useless
#   force xml2js to use that new sax.js

src/sax.mjs : node_modules/sax/lib/sax.js wrapsrc/hack-sax.pl Makefile
	perl wrapsrc/hack-sax.pl < node_modules/sax/lib/sax.js > src/sax.mjs
#	sed -e '1s@^;@@' -e 's@require.*stream.*$$@function () {}@' \
#		< node_modules/sax/lib/sax.js > src/sax.js

src/xml2js.mjs : node_modules/xml-js/lib/xml2js.js wrapsrc/hack-xml2js.pl Makefile
	perl wrapsrc/hack-xml2js.pl < node_modules/xml-js/lib/xml2js.js \
		> src/xml2js.mjs
#	cp -rp node_modules/xml-js/lib/*.js src/
#	cd src/ && rm -f xml2json.js js*xml.js index.js
#	sed -e 's@require..sax..@require("./sax.js")@' \
#		< node_modules/xml-js/lib/xml2js.js > src/xml2js.js

src/options-helper.js : node_modules/xml-js/lib/options-helper.js \
						wrapsrc/hack-options-helper.pl Makefile
	perl wrapsrc/hack-options-helper.pl \
		< node_modules/xml-js/lib/options-helper.js \
		> src/options-helper.js
#	cp -rp node_modules/xml-js/lib/*.js src/
#	cd src/ && rm -f xml2json.js js*xml.js index.js
#	sed -e 's@require..sax..@require("./sax.js")@' \
#		< node_modules/xml-js/lib/xml2js.js > src/xml2js.js

prepare.modules : codegradx.js
codegradx.js : codegradx.mjs
	sed < codegradx.mjs > codegradx.js \
		-e 's@export const@const@;s@// module.exports@module.exports@'
	diff codegradx.js codegradx.mjs || true

tests : test.with.real.servers
test.with.real.servers : prepare
	m test.within.browser
	m test.out.of.browser

test.out.of.browser : TOBEFIXED
	node_modules/.bin/jasmine --random=false \
		spec/[0-8]*.mjs 2>&1 | tee /tmp/spec.log

# Use local configuration file: Archive/cqhome.codegradx.org
test.within.browser :
	cd spec/ && ln -sf ../node_modules/jasmine-core .
	@echo "Browse http://localhost/CodeGradX/spec/tests.html?random=false"
#	@echo "Browse http://tests.codegradx.org/CodeGradX/spec/tests.html?random=false"

publish : lint prepare clean
	git status .
	-git commit -m "NPM publication `date`" .
	git push
	-rm -f CodeGradX.tgz
	m CodeGradX.tgz
	cp -pf tmp/CodeGradX/package.json .
	npm publish .
	rm -rf tmp
	sleep 10 ; npm install -g codegradx@`jq -r .version < package.json`
	rsync -avu CodeGradX.tgz \
		${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/

CodeGradX.tgz :
	-rm -rf tmp
	mkdir -p tmp
	cd tmp/ && \
	  git clone https://github.com/ChristianQueinnec/CodeGradX.git
	cd tmp/CodeGradX/ && rm -rf .git*
	cd tmp/CodeGradX/ && npm version patch
	tar czf CodeGradX.tgz -C tmp CodeGradX
	tar tzf CodeGradX.tgz

REMOTE	=	www.paracamplus.com
install : 
	-rm CodeGradX.tgz
	m CodeGradX.tgz
	rsync -avu CodeGradX.tgz \
		${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/
# Caution: inodes may lack!

# ####################### Obsolete
# ###################### determine modules wrapped more than once

XXprepare : wrapsrc/all.sh wrapsrc/webpack.all.config.js prepare.modules
	-rm -rf wrapsrc/dist/
	bash wrapsrc/all.sh
	@echo "New modules are now in src/"

compute.multiple.wrapped.modules : prepare \
	/tmp/sax.txt /tmp/xmlbuilder.txt /tmp/xml2js.txt
	diff -y /tmp/sax.txt /tmp/xml2js.txt
# sax.txt is included in xml2js.txt
	diff -y /tmp/xml2js.txt /tmp/xmlbuilder.txt
# xmlbuilder is included in xml2js (nothing in common with sax)
/tmp/sax.txt : 
	grep -F '!*** ./node_modules/' < wrapsrc/dist/sax.bundle.js |\
	sed -e 's@![*][*][*] ./@@' -e 's@ [*][*][*]!@@' | \
	sort -u >/tmp/sax.txt
/tmp/xmlbuilder.txt : 
	grep -F '!*** ./node_modules/' < wrapsrc/dist/xmlbuilder.bundle.js |\
	sed -e 's@![*][*][*] ./@@' -e 's@ [*][*][*]!@@' |\
	sort -u >/tmp/xmlbuilder.txt
/tmp/xml2js.txt : 
	grep -F '!*** ./node_modules/' < wrapsrc/dist/xml2js.bundle.js |\
	sed -e 's@![*][*][*] ./@@' -e 's@ [*][*][*]!@@' |\
	sort -u >/tmp/xml2js.txt

# end of Makefile
