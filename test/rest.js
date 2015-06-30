/* global describe, it*/
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai');
chai.use(require("chai-as-promised"));
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const request = require('supertest');
const kronos = require('../lib/manager.js');

let testPort = 12345;

describe('service manager REST', function () {
  let url;

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

  function shutdownManager (manager,done) {
    return function() {
      manager.shutdown().then(function () {
        done();
      });
    };
  }

  function initManager() {
    return kronos.manager({
      flows: flowDecl,
      port: testPort
    });
  }

  describe('health', function () {
    url = '/health';
    it(`GET ${url}`, function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get(url)
          //.expect('Content-Type', /json/)
          .expect(200, shutdownManager(manager,done));
      });
    });
  });

  describe('state', function () {
    url = '/state';
    it(`GET ${url}`, function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get(url)
          .set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(200, shutdownManager(manager,done));
      });
    });
  });

  describe('flows', function () {
    url = '/flows';
    it(`GET ${url}`, function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get(url)
          .set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(200, shutdownManager(manager,done));
      });
    });
    url = '/flows/flow1';
    it(`GET ${url}`, function (done) {
      initManager().then(function (manager) {
        request(manager.app.listen())
          .get(url)
          .set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(200, shutdownManager(manager,done));
      });
    });
  });
});
