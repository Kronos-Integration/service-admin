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

const portA = 12346;
const portB = 12347;

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
  function initManagerWithFlow(name, port, flow) {
    return rest.manager(kronos.manager({
      name: name
    }), {
      port: port
    }).then(function (manager) {
      require('kronos-service-manager-addon').registerWithManager(manager);

      return manager.registerFlows(flow);
    });
  }

  function shutdownManagers(managers, done, e) {
    try {
      Promise.all(managers.map(function (m) {
        return m.shutdown();
      })).then(function () {
        done(e);
      }, function () {
        done(e);
      });
    } catch (e) {
      done(e);
    }
  }


  describe('channel', function () {
    this.timeout(5000);

    it('open', function (done) {
      Promise.all([
          initManagerWithFlow('managerA', portA, flowA),
          initManagerWithFlow('managerB', portB, flowB)
        ])
        .then(function (flows) {
          try {
            const flowA = flows[0];
            const flowB = flows[1];
            console.log(`flows: ${flows}`);
            console.log(`managerA: ${flowA.manager}`);
            console.log(`managerB: ${flowB.manager}`);

            request(flowB.manager.app.listen())
              .get('/endpoints')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .expect(function (res) {
                const response = JSON.parse(res.text);
                console.log(`endpoints: ${res.text}`);
                if (response.name !== 'myManager') throw Error("name");
              });

            flowB.start().then(
              function () {
                flowA.start();
              }
            );

            // wait a bit to manually check http
            setTimeout(function () {
              shutdownManagers([flowA.manager, flowB.manager], done);
            }, 2000);
          } catch (e) {
            shutdownManagers([flowA.manager, flowB.manager], done, e);
          }
        }, done);
    });
  });
});
