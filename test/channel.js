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

const portA = 12345;
const portB = 12346;

describe('service manager channel', function () {
  function initManager(name,port) {
    return rest.manager(kronos.manager({
      name: name
    }), {
      port: port
    });
  }

  function shutdownManager(manager, done) {
    return function (error, result) {
      manager.shutdown().then(function () {
        if (error) {
          return done(error); 
        } else done();
      }, done);
    };
  }


  describe('health', function () {
    it('GET /health', function (done) {
      Promise.all([
        initManager('managerA',portA),
        initManager('managerB',portB)
        ])
      .then(function (managers) {
        const managerA = managers[0];
        const managerB = managers[1];
        console.log(`managers: ${managers[0].httpServerPort} <=> ${managers[1].httpServerPort}`);
        done();
      }, done);
    });
  });
});
