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

describe('service admin', () => {
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
        "type": "kronos-stdout"
      }
    }
  };

  let myManager = kronos.manager({
    kronos: {
      logLevel: "trace",
    },
    admin: {
      logLevel: "trace",
      port: 4711
    }
  }, [require('kronos-flow'),
    require('kronos-flow-control-step'),
    require('kronos-step-stdio'),
    require('kronos-http-routing-step')
  ]);

  describe('register admin service', () =>
    myManager.then(manager =>
      admin.registerWithManager(manager).then(() => {
        it('has admin service', () => assert.equal(manager.services.admin.name, 'admin'));

        return manager.services.admin.start().then(() => {
          console.log(`*** STATE ${manager.services.admin.state}`);
          it('admin service is running', () => assert.equal(manager.services.admin.state, 'running'));
        }).catch(e => {
          console.log(e);
        });
      })
    )
  );

  describe('http', () => {
    xit('GET /flows', () => {
      return myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .get('/flows')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(res => {
          const response = JSON.parse(res.text);
          console.log(`RES: ${JSON.stringify(response)}`);
          if (response[1].url !== 'flow1') throw Error("flow missing");
        })
        .expect(200)
        .end());
    });
    xit('GET /flows/flow1', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .get('/flows/flow1')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          //console.log(`reponse: ${res.text}`);
          const response = JSON.parse(res.text);
          if (response.name !== 'flow1') throw Error("flow flow1 missing");
        })
        .end()
      )
    );

    xit('DELETE /flows/flow1', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .delete('/flows/flow1')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          const response = JSON.parse(res.text);
          if (Object.keys(response).length > 0) throw Error("delete error");
        })
        .end()
      ));

    xit('POST /flows', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .post('/flows')
        .send({
          "name": "a",
          "type": "kronos-flow",
          "steps": {}
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          console.log(res.text);
          //const response = JSON.parse(res.text);
          //if (response.name !== 'flow1') throw Error("flow flow1 missing");
        })
        .end()
      )
    );

    xit('POST /flows with error', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
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
        .expect(res => {
          console.log("RES:" + res.text);
          //const response = JSON.parse(res.text);
          //if (response.name !== 'flow1') throw Error("flow flow1 missing");
        })
        .end()
      )
    );
  });
});
