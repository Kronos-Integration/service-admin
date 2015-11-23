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

let testPort = 12349;

describe('service manager admin', function () {
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
});
