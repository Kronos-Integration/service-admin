/* global describe, it, xit, before, after */
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
      port: 4712
    }
  }, [require('kronos-flow'),
    require('kronos-service-registry'),
    require('kronos-flow-control-step'),
    require('kronos-step-aggregate'),
    require('kronos-step-stdio'),
    require('kronos-interceptor-http-request'),
    require('kronos-http-routing-step')
  ]);

  it('register admin service', () =>
    myManager.then(manager =>
      admin.registerWithManager(manager).then(() => manager.services.admin.start().then(() =>
        assert.equal(manager.services.admin.state, 'running')
      ))
    )
  );

  describe('http', () => {
    xit('GET /software', () =>
      myManager.then(manager => {
        const admin = manager.services.admin;
        const app = admin.server.listen();
        return request(app)
          .get('/software')
          //.set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(res => {
            console.log(res);
            const response = JSON.parse(res);
            console.log(`RES: ${JSON.stringify(response)}`);
          })
          .expect(200)
          .end();
      })
    );

    xit('GET /flow', () =>
      myManager.then(manager => {
        const admin = manager.services.admin;
        const app = admin.server.listen();
        //console.log(app);
        return request(app)
          .get('/flow')
          .set('Accept', 'application/json')
          //.expect('Content-Type', /json/)
          .expect(res => {
            console.log(res);

            const response = JSON.parse(res);
            console.log(`RES: ${JSON.stringify(response)}`);
            if (response[1].url !== 'flow1') throw Error("flow missing");
          })
          .expect(200)
          .end();
      })
    );

    xit('GET /flow/flow1', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .get('/flow/flow1')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          console.log(res);

          //console.log(`reponse: ${res.text}`);
          const response = JSON.parse(res.text);
          if (response.name !== 'flow1') throw Error("flow flow1 missing");
        })
        .end()
      )
    );

    xit('DELETE /flow/flow1', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .delete('/flow/flow1')
        //        .set('Accept', 'application/json')
        //        .expect('Content-Type', /json/)
        //.expect(200)
        .expect(res => {
          console.log(`AA ${res}`);
          const response = JSON.parse(res.body);
          if (Object.keys(response).length > 0) throw Error("delete error");
        })
        .end()
      ));

    xit('PUT /flow', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .put('/flow')
        .send(JSON.stringify({
          "name": "a",
          "type": "kronos-flow",
          "steps": {}
        }))
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

    xit('POST /flow with error', () =>
      myManager.then(manager =>
        request(manager.services.admin.server.listen())
        .post('/flow')
        .send(JSON.stringify({
          "name": "a",
          "type": "kronos-flow",
          "steps": {
            "s1": {
              "type": "no-such-type"
            }
          }
        }))
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
