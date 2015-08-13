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

const flowA = {
  "flowA": {
    "steps": {
      "s1": {
        "type": "kronos-copy",
        "endpoints": {
          "in": "stdin",
          "out": `kronos+http://localhost:${portB}/endpoint/flowB/s1/in`
        }
      }
    }
  }
};

const flowB = {
  "flowB": {
    "steps": {
      "s1": {
        "type": "kronos-copy",
        "endpoints": {
          "in": `kronos+http:`,
          "out": "stdout"
        }
      }
    }
  }
};

describe('service manager channel', function () {
  function initManager(name, port, flow) {
    return rest.manager(kronos.manager({
      name: name,
      flows: flow
    }), {
      port: port
    });
  }

  function shutdownManagers(managers, done) {
    Promise.all(managers.map(function (m) {
      return m.shutdown();
    })).then(function () {
      done();
    }, function (error) {
      done(error);
    });
  }


  describe('channel', function () {
    it('open', function (done) {
      Promise.all([
          initManager('managerA', portA, flowA),
          initManager('managerB', portB, flowB)
        ])
        .then(function (managers) {
          const managerA = managers[0];
          const managerB = managers[1];
          console.log(`managers: ${managers[0]} <=> ${managers[1]}`);

          shutdownManagers(managers, done);
        }, done);
    });
  });
});
