// Jasmine tests for servers availability related methods.
// Here we test redirection from generic a, e, x servers

import { CodeGradX } from '../codegradx.mjs';

describe('CodeGradX 07', function () {
    it('should be loaded', function () {
        expect(CodeGradX).toBeDefined();
    });

    function make_faildone (done) {
        return function faildone (reason) {
            var state = CodeGradX.getCurrentState();
            state.debug(reason).show();
            fail(reason);
            done();
        };
    }

    function initializer (state) {
        state.servers = {
            domain: '.localdomain',
            names: ['a', 'e', 'x', 's'],
            protocol: 'https',
            a: {
                suffix: '/alive',
                0: {
                    host: "a.codegradx.org",
                    enabled: false
                }
            },
            e: {
                suffix: '/alive',
                0: {
                    host: "e.codegradx.org",
                    enabled: false
                }
            },
            x: {
                protocol: 'https',
                suffix: '/dbalive',
                0: {
                    host: "x.codegradx.org",
                    enabled: false
                }
            },
            s: {
                suffix: '/',
                0: {
                    host: "s.codegradx.org",
                    enabled: false
                }
            }
        };
        return state;
    }

    it('should create a State', function (done) {
        var state = new CodeGradX.State(initializer);
        expect(state).toBeDefined();
        expect(state instanceof CodeGradX.State).toBeTruthy();
        done();
    });

    it('access redirection via A', function (done) {
        var state = new CodeGradX.State(initializer);
        var faildone = make_faildone(done);
        expect(state).toBeDefined();
        expect(Object.keys(state.servers.a).length).toBe(2);
        delete state.servers.a[0].lastError;
        state.checkServers('a').then(function (descriptions) {
            console.log(state.servers.a);//DEBUG
            state.log.show(); // DEBUG
            expect(descriptions).toBe(state.servers.a);
            expect(descriptions[0].host).toBe('a.codegradx.org');
            //expect(descriptions[0].enabled).toBeTruthy();
            console.log(descriptions[0].lastError); // DEBUG
            expect(descriptions[0].lastError).not.toBeDefined();
            expect(descriptions[1]).not.toBeDefined();
            //expect(descriptions[1].host).toMatch(/a\d.codegradx.org/);
            //expect(descriptions[1].enabled).toBeTruthy();
            //expect(descriptions[1].lastError).not.toBeDefined();
            done();
        }, faildone);
    });

    it('access redirection via E', function (done) {
        var state = new CodeGradX.State(initializer);
        var faildone = make_faildone(done);
        expect(state).toBeDefined();
        expect(Object.keys(state.servers.e).length).toBe(2);
        delete state.servers.e[0].lastError;
        state.checkServers('e').then(function (descriptions) {
            console.log(state.servers.e);//DEBUG
            state.log.show(); // DEBUG
            expect(descriptions).toBe(state.servers.e);
            expect(descriptions[0].host).toBe('e.codegradx.org');
            //expect(descriptions[0].enabled).toBeTruthy();
            console.log(descriptions[0].lastError); // DEBUG
            expect(descriptions[0].lastError).not.toBeDefined();
            expect(descriptions[1]).not.toBeDefined();
            //expect(descriptions[1].host).toMatch(/e\d.codegradx.org/);
            //expect(descriptions[1].enabled).toBeTruthy();
            //expect(descriptions[1].lastError).not.toBeDefined();
            done();
        }, faildone);
    });

    it('access redirection via X', function (done) {
        var state = new CodeGradX.State(initializer);
        var faildone = make_faildone(done);
        expect(state).toBeDefined();
        expect(Object.keys(state.servers.x).length).toBe(3);
        delete state.servers.x[0].lastError;
        state.checkServers('x').then(function (descriptions) {
            console.log(state.servers.x);//DEBUG
            state.log.show(); // DEBUG
            expect(descriptions).toBe(state.servers.x);
            expect(descriptions[0].host).toBe('x.codegradx.org');
            //expect(descriptions[0].enabled).toBeTruthy();
            expect(descriptions[0].lastError).not.toBeDefined();
            expect(descriptions[1]).not.toBeDefined();
            //expect(descriptions[1].host).toMatch(/x\d.codegradx.org/);
            //expect(descriptions[1].enabled).toBeTruthy();
            //expect(descriptions[1].lastError).not.toBeDefined();
            done();
        }, faildone);
    });

});
