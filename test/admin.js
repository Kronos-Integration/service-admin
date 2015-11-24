/* global describe, it */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  request = require("supertest-as-promised")(Promise),
  kronos = require('kronos-service-manager'),
  admin = require('../lib/manager.js'),
  wt = require('koa-jwt');

chai.use(require("chai-as-promised"));

let testPort = 12345;

describe('service manager admin', function () {
  const flowDecl = {
    "name": "flow1",
    "type": "kronos-flow",
    "steps": {
      "s0": {
        "type": "kronos-stdin",
        "endpoints": {
          "out": "s1/in"
        }
      },
      "s1": {
        "type": "kronos-copy",
        "endpoints": {
          "out": "s2/in"
        }
      },
      "s2": {
        "type": "kronos-stdout"
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
    return admin.manager(kronos.manager({
      name: 'myManager'
    }), {
      port: testPort
        /*,
              jwt: { secret: "the secret" }*/
    }).then(function (manager) {
      require('kronos-step-stdio').registerWithManager(manager);
      require('kronos-flow').registerWithManager(manager);
      manager.registerFlow(manager.getStepInstance(flowDecl));
      return manager;
    });

    testPort++; // TODO somehow koa-websocket does not shutdown correctly
  }

  describe('flows', function () {
    it('GET /flows', function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get('/flows')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(function (res) {
            const response = JSON.parse(res.text);
            //console.log(`RES: ${JSON.stringify(response)}`);
            if (response[0].url !== 'flow1') throw Error("flow missing");
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
            //console.log(`reponse: ${res.text}`);
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
            "name": "a",
            "type": "kronos-flow",
            "steps": {}
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
            "name": "a",
            "type": "kronos-flow",
            "steps": {
              "s1": {
                "type": "no-such-type"
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
