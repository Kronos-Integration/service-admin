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

  var myManager;

  function getManager() {
    if (!myManager) {
      myManager = kronos.manager({
        services: {
          admin: {
            logLevel: "trace",
            port: 4711
          }
        }
      }).then(manager => {
        require('kronos-step-stdio').registerWithManager(manager);
        admin.registerWithManager(manager);
        return Promise.resolve(manager);
        /*
        const as = manager.serviceGet('admin');
        return as.start().then(service => Promise.resolve(manager));
        */
      });
    }
    return myManager;
  }

  describe('flows', function () {
    it('GET /flows', function (done) {
      getManager().then(function (manager) {
        const as = manager.services.admin;

        try {
          request(as.app.listen())
            .get('/flows')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(function (res) {
              const response = JSON.parse(res.text);
              //console.log(`RES: ${JSON.stringify(response)}`);
              if (response[1].url !== 'flow1') throw Error("flow missing");
            })
            .expect(200)
            .end(done);
        } catch (e) {
          console.error(e);
        }
      }, done);
    });
    it('GET /flows/flow1', function (done) {
      getManager().then(function (manager) {
        request(as.app.listen())
          .get('/flows/flow1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            //console.log(`reponse: ${res.text}`);
            const response = JSON.parse(res.text);
            if (response.name !== 'flow1') throw Error("flow flow1 missing");
          })
          .end(done);
      }, done);
    });

    it('DELETE /flows/flow1', function (done) {
      getManager().then(function (manager) {
        request(as.app.listen())
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
          .end(done);
      }, done);
    });

    it('POST /flows', function (done) {
      getManager().then(function (manager) {
        request(as.app.listen())
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
          .end(done);
      }, done);
    });

    it('POST /flows with error', function (done) {
      getManager().then(function (manager) {
        request(as.app.listen())
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
            console.log("RES:" + res.text);
            //const response = JSON.parse(res.text);
            //if (response.name !== 'flow1') throw Error("flow flow1 missing");
          })
          .end(done);
      }, done);
    });
  });
});
