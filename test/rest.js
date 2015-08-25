/* global describe, it */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai');
chai.use(require("chai-as-promised"));
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const request = require('supertest');

const kronos = require('kronos-service-manager');
const rest = require('../lib/manager.js');
const jwt = require('koa-jwt');

let testPort = 12345;

describe('service manager REST', function () {
  const flowDecl = {
    "flow1": {
      "steps": {
        "s1": {
          "type": "kronos-copy",
          "config": {
            "key1": "value1"
          },
          "endpoints": {
            "in": "stdin",
            "out": "stdout"
          }
        }
      }
    }
  };

  function shutdownManager(manager, done) {
    return function (error, result) {
      manager.shutdown().then(function () {
        if (error) {
          return done(error); 
        } else done();
      }, done);
    };
  }

  function initManager() {
    return rest.manager(kronos.manager({
      name: 'myManager',
      flows: flowDecl
    }), {
      port: testPort
        /*,
              jwt: { secret: "the secret" }*/
    });

    testPort++; // TODO somehow koa-websocket does not shutdown correctly
  }

  describe('health', function () {
    it('GET /health', function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get('/health')
          .expect(200)
          .expect(function (res) {
            if (res.text !== 'OK') throw Error("not OK");
          })
          .end(shutdownManager(manager, done));
      }, done);
    });
  });

  describe('state', function () {
    it('GET /state', function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get('/state')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            const response = JSON.parse(res.text);
            if (!response.uptime > 0) throw Error("uptime > 0 ?");
            if (response.name !== 'myManager') throw Error("name");
          })
          .end(shutdownManager(manager, done));
      }, done);
    });
  });

  describe('flows', function () {
    it('GET /flows', function (done) {
      initManager().then(function (manager) {
        console.log(manager.flowDefinitions);
        request(manager.app.listen())
          .get('/flows')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(function (res) {
            const response = JSON.parse(res.text);
            //console.log(`RES: ${JSON.stringify(response)}`);
            if (response[0].url !== 'flow1') throw Error("flow flow1 missing");
          })
          .expect(200)
          .end(shutdownManager(manager, done));
      }, done);
    });
    it('GET /flows/flow1', function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get('/flows/flow1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            const response = JSON.parse(res.text);
            if (response.name !== 'flow1') throw Error("flow flow1 missing");
          })
          .end(shutdownManager(manager, done));
      }, done);
    });

    it('DELETE /flows/flow1', function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .delete('/flows/flow1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            const response = JSON.parse(res.text);
            if (Object.keys(response).length > 0) throw Error("delete error");
          })
          /*
                    .get('/flows')
                    .expect(200)
                    .expect(function(res) {
                      const response = JSON.parse(res.text);
                      console.log(`RES: ${JSON.stringify(response)}`);
                    })
          */
          .end(shutdownManager(manager, done));
      }, done);
    });

    it('POST /flows', function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .post('/flows')
          .send({
            "a": {
              "steps": {}
            }
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            console.log(res.text);
            //const response = JSON.parse(res.text);
            //if (response.name !== 'flow1') throw Error("flow flow1 missing");
          })
          .end(shutdownManager(manager, done));
      }, done);
    });

    it('POST /flows with error', function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .post('/flows')
          .send({
            "a": {
              "steps": {
                "s1": {
                  "type": "no-such-type"
                }
              }
            }
          })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            console.log(res.text);
            //const response = JSON.parse(res.text);
            //if (response.name !== 'flow1') throw Error("flow flow1 missing");
          })
          .end(shutdownManager(manager, done));
      }, done);
    });

  });
});
