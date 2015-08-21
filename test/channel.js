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
          "out": `kronos+http://localhost:${portB}/endpoints/0001`
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
          "in": "kronos+http:0001",
          "out": "stdout"
        }
      }
    }
  }
};

describe('service manager channel', function () {
  function initManager(name, port, flow) {
    return rest.manager(kronos.manager({
      name: name
    }), {
      port: port
    }).then(function (manager) {
      manager.registerFlows(flow);
      return manager;
    });
  }

  function shutdownManagers(managers, done) {
    Promise.all(managers.map(function (m) {
      return m.shutdown();
    })).then(function () {
      done();
    }, done);
  }


  describe('channel', function () {
    this.timeout(5000);

    it('open', function (done) {
      Promise.all([
          initManager('managerA', portA, flowA),
          initManager('managerB', portB, flowB)
        ])
        .then(function (managers) {
          const managerA = managers[0];
          const managerB = managers[1];
          //console.log(`managers: ${managerA} <=> ${managerB}`);
          //console.log(`flowA: ${JSON.stringify(managerA.flowDefinitions.flowA)}`);
          //console.log(`flowB: ${JSON.stringify(managerB.flowDefinitions.flowB)}`);

          request(managerB.app.listen())
            .get('/endpoints')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .expect(function (res) {
              const response = JSON.parse(res.text);
              console.log(`endpoints: ${res.text}`);
              if (response.name !== 'myManager') throw Error("name");
            });

          managerB.intializeFlow('flowB');

          managerA.intializeFlow('flowA');

          // wait a bit to manually check http
          setTimeout(function() { shutdownManagers(managers, done); }, 2000);
        }, done);
    });
  });
});
