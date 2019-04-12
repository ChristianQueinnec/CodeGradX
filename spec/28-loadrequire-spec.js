// testing loadrequire
// Time-stamp: "2019-04-12 18:25:07 queinnec"

const CodeGradX = require('../index.js');
const http = require('http');
const fs = require('fs');

describe('testing loadrequire', function () {
    
    function make_faildone (done) {
        return function faildone (reason) {
            var state = CodeGradX.getCurrentState();
            state.debug('faildone', reason).show();
            console.log(reason);
            fail(reason);
            done();
        };
    }

    // NOTA Currently, this server is not reached !?
    const port = 3000;
    const server = http.createServer((req, res) => {
        const filename = req.path;
        if ( fs.existsSync(filename) ) {
            res.writeHead(200, {
                'Content-Type': 'application/javascript',
                'Server': 'Jasmine server'
            });
            const content = fs.readFileSync(filename);
            res.end(content);
        } else {
            res.writeHead(400, {
                'Server': 'Jasmine server'
            }, 'Missing module');
            res.end();
        }
    }).listen(port);

    it('load inexistent module z.js', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('z.js', { port })
            .then(faildone)
            .catch((exc) => {
                expect(exc.message).toMatch(/missing/i);
                done();
            });
    });

    it('load module a.js', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('a.js', { port })
            .then((exports) => {
                //console.log(exports); //
                expect(exports.kind).toBe('a');
                done();
            }).catch(faildone);
    });

    let moduleB;
    it('load module b.js containing a function', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('b.js', { port })
            .then((exports) => {
                expect(exports.hello).toBeDefined();
                expect(exports.hello('ME')).toBe('hello ME');
                moduleB = exports;
                done();
            }).catch(faildone);
    });

    it('reload module b.js', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('b.js', { port })
            .then((exports) => {
                expect(exports === moduleB);
                expect(CodeGradX.cachedrequire('b.js')).toBe(moduleB);
                done();
            }).catch(faildone);
    });

    it('load module with slash', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('f/b.js', { port })
            .then((exports) => {
                expect(exports.hello).toBeDefined();
                expect(exports.hello('ME')).toBe('HELLO ME');
                moduleB = exports;
                done();
            }).catch(faildone);
    });

    it('load module c.js containing an erroneous function', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('c.js', { port })
            .then((exports) => {
                expect(exports.bad).toBeDefined();
                try {
                    console.log(exports.bad(33));
                    faildone();
                } catch (exc) {
                    expect(exc.message).toBe('33');
                    done();
                }
            }).catch(faildone);
    });
    
    it('load module d.js that requires a.js from cache', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        //console.log(CodeGradX.loadrequire.cache);
        CodeGradX.loadrequire('d.js', { port })
            .then((exports) => {
                //console.log(exports); //
                expect(exports.a.kind).toBe('a');
                done();
            }).catch(faildone);
    });

    it('load module e.js that requires g.js (not from cache)', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        //console.log(CodeGradX.loadrequire.cache);
        CodeGradX.loadrequire('e.js', { port })
            .then((exports) => {
                faildone();
            }).catch(exc => {
                expect(exc.message).toMatch(/uncached module g/i);
                done();
            });
    });

    it('load module h.js syntactically incorrect', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('h.js', { port })
            .then((exports) => {
                faildone();
            }).catch(exc => {
                expect(exc.message).toMatch(/unexpected identifier/i);
                expect(CodeGradX.loadrequire.cache['h.js']).toBeUndefined();
                done();
            });
    });
    it('load module i.js without exports', function (done) {
        const state = new CodeGradX.State();
        const faildone = make_faildone(done);
        CodeGradX.loadrequire('i.js', { port })
            .then((exports) => {
                faildone();
            }).catch(exc => {
                expect(exc.message).toMatch(/missing module.exports/i);
                expect(CodeGradX.loadrequire.cache['i.js']).toBeUndefined();
                done();
            });
    });


    it("close server", function (done) {
        server.close();
        done();
    });

});
