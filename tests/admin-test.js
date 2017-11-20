import { registerWithManager } from '../src/service-admin';
import test from 'ava';

const { manager } = require('kronos-service-manager');

async function makeManager() {
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

  return manager(
    {
      kronos: {
        logLevel: 'trace'
      },
      'koa-admin': {
        logLevel: 'trace'
      },
      admin: {
        logLevel: 'trace'
      }
    },
    [
      require('kronos-flow'),
      require('kronos-service-registry'),
      require('kronos-service-koa'),
      require('kronos-service-health-check'),
      require('kronos-flow-control-step'),
      require('kronos-step-aggregate'),
      require('kronos-step-stdio'),
      require('kronos-interceptor-http-request'),
      require('kronos-interceptor-decode-json'),
      require('kronos-http-routing-step')
    ]
  );
}

test('service admin register admin service', async t => {
  const manager = await makeManager();

  await registerWithManager(manager);

  await manager.services.admin.start();

  t.is(manager.services.admin.state, 'running');
});

/*
describe('service admin', () => {
  describe('http', () => {
    it('GET /localnode/software', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .get('/api/localnode/software')
          .then(res => {
            expect(res).to.have.status(200);
          })
          .catch(err => {
            throw err;
          });
      }));

    it('PUT /localnode/flow', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .put('/api/localnode/flow/')
          .send(
            JSON.stringify({
              name: 'a',
              type: 'kronos-flow',
              steps: {}
            })
          )
          .then(res => {
            expect(res).to.have.status(200);
          });
      }));

    it('GET /localnode/flow', () =>
      myManager.then(manager => {
        manager.registerFlow(
          manager.createStepInstanceFromConfig(flowDecl, manager)
        );
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .get('/api/localnode/flow')
          .then(res => {
            expect(res).to.have.status(200);
          });
      }));

    it('GET /localnode/flow/a', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();

        return request(app)
          .get('/api/localnode/flow/a')
          .then(res => {
            expect(res).to.have.status(200);
          });
      }));

    it('DELETE /localnode/flow/a', () =>
      myManager.then(manager => {
        const admin = manager.services['koa-admin'];
        const app = admin.server.listen();
        return request(app)
          .delete('/api/localnode/flow/a')
          .then(res => {
            expect(res).to.have.status(200);
          });
      }));

    xit('PUT /localnode/flow with error', () => {
      try {
        return myManager
          .then(manager => {
            const admin = manager.services['koa-admin'];
            const app = admin.server.listen();
            return request(app)
              .put('/api/localnode/flow/')
              .send(
                JSON.stringify({
                  name: 'a',
                  type: 'kronos-flow',
                  steps: {
                    s1: {
                      type: 'no-such-type'
                    }
                  }
                })
              )
              .then(
                res => {
                  console.log(`AA ${res}`);
                  expect(res).to.have.status(200);
                },
                rej => {
                  console.log(`REJ: ${rej}`);
                }
              )
              .catch(e => {
                console.log(`CATCH: ${e}`);
              });
          })
          .catch(e => {
            console.log(`CATCH 2: ${e}`);
          });
      } catch (e) {
        console.log(`ex: ${e}`);
      }
    });
  });
});

*/
