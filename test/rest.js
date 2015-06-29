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

describe('service manager', function () {
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

  describe('GET /health', function () {
    it('respond with json', function (done) {
      const promise = kronos.manager({
        flows: flowDecl,
        port: testPort
      });

      promise.then(function (manager) {
        request(manager.app.listen())
          .get('/state')
          //.expect('Content-Type', /json/)
          .expect(200, function () {
            manager.shutdown().then(function () {
              done();
            });
          });
      });
    });
  });

  describe('GET /state', function () {
    it('respond with json', function (done) {
      const promise = kronos.manager({
        flows: flowDecl,
        port: testPort
      });

      promise.then(function (manager) {
        request(manager.app.listen())
          .get('/state')
          .set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(200, function () {
            manager.shutdown().then(function () {
              done();
            });
          });
      });
    });
  });

  describe('GET /flows', function () {
    it('respond with json', function (done) {
      const promise = kronos.manager({
        flows: flowDecl,
        port: testPort
      });

      promise.then(function (manager) {
        request(manager.app.listen())
          .get('/state')
          .set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(200, function () {
            manager.shutdown().then(function () {
              done();
            });
          });
      });
    });
  });
  describe('GET /flows/flow1', function () {
    it('respond with json', function (done) {
      const promise = kronos.manager({
        flows: flowDecl,
        port: testPort
      });

      promise.then(function (manager) {
        request(manager.app.listen())
          .get('/state')
          .set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(200, function () {
            manager.shutdown().then(function() { done(); });
          });
      });
    });
  });

});
