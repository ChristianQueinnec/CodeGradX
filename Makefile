# Time-stamp: "2019-04-07 10:13:17 queinnec"

work : nothing 
clean :: cleanMakefile

lint :
	node_modules/.bin/eslint index.js src/*.js

tests : test.with.real.servers
test.with.real.servers :
	node_modules/.bin/jasmine --random=false \
		spec/[0-8]*.js 2>&1 | tee /tmp/spec.log

publish : lint



# end of Makefile
