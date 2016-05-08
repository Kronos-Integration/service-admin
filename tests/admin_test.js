/* global describe, it, xit, before, after */
/* jslint node: true, esnext: true */

'use strict';

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
    name: 'a',
    type: 'kronos-flow',
    steps: {
      s0: {
        type: 'kronos-stdin',
        endpoints: {
          out: 's1/in'
        }
      },
      s1: {
        type: 'kronos-stdout'
      }
    }
  };

  let myManager = kronos.manager({
    kronos: {
      logLevel: 'trace',
    },
    'koa-admin': {
      logLevel: 'trace'
    },
    admin: {
      logLevel: 'trace'
    }
  }, [require('kronos-flow'),
    require('kronos-service-registry'),
    require('kronos-service-koa'),
    require('kronos-service-health-check'),
    require('kronos-flow-control-step'),
    require('kronos-step-aggregate'),
    require('kronos-step-stdio'),
    require('kronos-interceptor-http-request'),
    require('kronos-interceptor-decode-json'),
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
          .get('/api/software').then(res => {
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
          .put('/api/flow/').send(JSON.stringify({
            name: 'a',
            type: 'kronos-flow',
            steps: {}
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
          .get('/api/flow').then(res => {
            expect(res).to.have.status(200);
          });
      })
    );

    it('GET /flow/a', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();

        return request(app)
          .get('/api/flow/a').then(res => {
            expect(res).to.have.status(200);
          });
      })
    );

    it('DELETE /flow/a', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .delete('/api/flow/a').then(res => {
            expect(res).to.have.status(200);
          });
      })
    );

    xit('PUT /flow with error', () => {
      try {
        return myManager.then(manager => {
          const admin = manager.services['koa-admin'];
          const app = admin.server.listen();
          return request(app)
            .put('/api/flow/').send(JSON.stringify({
              name: 'a',
              type: 'kronos-flow',
              steps: {
                s1: {
                  type: 'no-such-type'
                }
              }
            }))
            .then(res => {
              console.log(`AA ${res}`);
              expect(res).to.have.status(200);
            }, rej => {
              console.log(`REJ: ${rej}`);
            }).catch(e => {
              console.log(`CATCH: ${e}`);
            });
        }).catch(e => {
          console.log(`CATCH 2: ${e}`);
        });
      } catch (e) {
        console.log(`ex: ${e}`);
      }
    });
  });
});
