/* global describe, it */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  request = require("supertest-as-promised")(Promise),
  kronos = require('kronos-service-manager'),
  admin = require('../lib/adminService');

chai.use(require("chai-as-promised"));

describe('service manager admin', function () {
  function shutdownManager(manager, done) {
    return function (error, result) {
      manager.shutdown().then(() => {
        if (error) {
          return done(error); 
        } else done();
      }, done);
    };
  }

  function initManager() {
    return kronos.manager().then(manager => {
      require('kronos-step-stdio').registerWithManager(manager);
      admin.registerWithManager(manager);
      const as = manager.serviceGet('admin');
      return as.start().then(service => Promise.resolve(manager));
    });
  }

  describe('health', function () {
    it('GET /health', function (done) {
      initManager().then(function (manager) {

        console.log(
          `Admin: ${manager.services.admin} ${manager.services.admin.state} ${manager.services.admin.server}`
        );

        request(admin.server.listen())
          .get('/health')
          .expect(200)
          .expect(function (res) {
            if (res.text !== 'OK') throw Error("not OK");
          })
          .end(shutdownManager(manager, done));
      }, done);
    });
  });

  /*
    describe('state', function () {
      it('GET /state', function (done) {
        initManager().then(function (manager) {
          request(admin.server.listen())
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
    */
});
