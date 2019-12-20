# Time-stamp: "2019-12-20 14:37:52 queinnec"

work : nothing 
clean :: 
	-rm *~ src/*~ spec/*~

lint :
	node_modules/.bin/eslint *.mjs src/[cejpu]*.mjs
#src/*.mjs

prepare : wrapsrc/all.sh wrapsrc/webpack.all.config.js
	-rm -rf wrapsrc/dist/
	bash wrapsrc/all.sh
	@echo "New modules are now in src/"

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
	@echo "Browse http://172.22.0.1/CodeGradX/spec/tests.html?random=false"

publish : lint prepare clean
	git status .
	-git commit -m "NPM publication `date`" .
	git push
	-rm -f CodeGradX.tgz
	m CodeGradX.tgz
	npm publish CodeGradX.tgz
	cp -pf tmp/CodeGradX/package.json .
#	rm -rf tmp
	npm install -g codegradx@`jq -r .version < package.json`
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

# ###################### determine modules wrapped more than once
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
