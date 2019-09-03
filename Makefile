# Time-stamp: "2019-09-03 15:15:17 queinnec"

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
#	node_modules/.bin/jasmine --random=false \
#		spec/[0-8]*.js 2>&1 | tee /tmp/spec.log

# Use local configuration file: Archive/cqhome.codegradx.org
test.within.browser :
	cd spec/ && ln -sf ../node_modules/jasmine-core .
	@echo "Browse http://localhost/CodeGradX/spec/tests.html?random=false"

publish : lint clean
	git status .
	-git commit -m "NPM publication `date`" .
	git push
	-rm -f CodeGradX.tgz
#	m install
	cd tmp/CodeGradX/ && npm publish
	cp -pf tmp/CodeGradX/package.json .
	rm -rf tmp
	npm install -g codegradx@`jq -r .version < package.json`
	m install

CodeGradX.tgz :
	-rm -rf tmp
	mkdir -p tmp
	cd tmp/ && \
	  git clone https://github.com/ChristianQueinnec/CodeGradX.git
	rm -rf tmp/CodeGradX/.git
	cp -p package.json tmp/CodeGradX/
	cd tmp/CodeGradX/ && npm version patch
	tar czf CodeGradX.tgz -C tmp CodeGradX
	tar tzf CodeGradX.tgz

REMOTE	=	www.paracamplus.com
install :
	-rm CodeGradX.tgz
	m CodeGradX.tgz
	rsync -avu CodeGradX.tgz \
		${REMOTE}:/var/www/www.paracamplus.com/Resources/Javascript/


# end of Makefile
