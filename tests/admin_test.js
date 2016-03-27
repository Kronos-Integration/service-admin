/* global describe, it, xit, before, after */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  kronos = require('kronos-service-manager'),
  admin = require('../lib/adminService');

chai.use(require('chai-http'));

const request = chai.request;

describe('service admin', () => {
  const flowDecl = {
    "name": "a",
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
    "koa-admin": {
      logLevel: "trace"
    },
    "admin": {
      logLevel: "trace"
    }
  }, [require('kronos-flow'),
    require('kronos-service-registry'),
    require('kronos-service-koa'),
    require('kronos-service-health-check'),
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
      )).catch(console.log)
    )
  );

  describe('http', () => {
    it('GET /software', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .get('/software').then(res => {
            expect(res).to.have.status(200);
          }).catch(err => {
            throw err;
          });
      })
    );

    it('PUT /flow', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .put('/flow/').send(JSON.stringify({
            "name": "a",
            "type": "kronos-flow",
            "steps": {}
          })).then(res => {
            expect(res).to.have.status(200);
          });
      })
    );

    it('GET /flow', () =>
      myManager.then(manager => {
        manager.registerFlow(manager.createStepInstanceFromConfig(flowDecl, manager));
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .get('/flow').then(res => {
            expect(res).to.have.status(200);
          });
      })
    );

    it('GET /flow/a', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();

        return request(app)
          .get('/flow/a').then(res => {
            expect(res).to.have.status(200);
          });
      })
    );

    it('DELETE /flow/a', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .delete('/flow/a').then(res => {
            expect(res).to.have.status(200);
          });
      })
    );

    it('PUT /flow with error', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .put('/flow/').send(JSON.stringify({
            "name": "a",
            "type": "kronos-flow",
            "steps": {
              "s1": {
                "type": "no-such-type"
              }
            }
          }))
          .then(res => {
            expect(res).to.have.status(200);
          });
      })
    );
  });
});
