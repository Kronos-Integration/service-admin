/* jslint node: true, esnext: true */

"use strict";

const koa = require('koa'),
  route = require('koa-route'),
  jwt = require('koa-jwt'),
  websockify = require('koa-websocket');

exports.defaultKronosPort = 10000;

exports.manager = function (manager, options) {
  return manager.then(function (manager) {
    if (!options) { 
      options = {};
    }

    const port = options.port || exports.defaultKronosPort;

    const app = websockify(koa());
    manager.app = app;

    const hc = require('./controllers/health').initialize(manager);
    app.use(route.get('/health', hc.status));

    /*
        const auth = require('./controllers/auth').initialize(manager);
        app.use(route.get('/auth', auth.get));
    */

    // secure all the following requests if jwt is present
    if (options.jwt) {
      app.use(jwt({
        secret: options.jwt.secret
      }));
    }

    const sc = require('./controllers/state').initialize(manager);
    app.use(route.get('/state', sc.list));
    app.ws.use(route.all('/state', sc.ws));

    const fc = require('./controllers/flow').initialize(manager);
    app.use(route.get('/flows', fc.list));
    app.use(route.get('/flows/:id', fc.fetch));
    app.use(route.delete('/flows/:id', fc.delete));
    app.use(route.post('/flows', fc.insert));
    app.use(route.post('/flows/:id/start', fc.start));
    app.use(route.post('/flows/:id/stop', fc.stop));
    app.ws.use(route.all('/flows', fc.ws));

    manager.httpServerPort = port;
    manager.httpServer = app.listen(port);

    const protoShutdown = manager.shutdown;

    manager = Object.create(manager, {
      controller: {
        value: {}
      },
      shutdown: {
        value: function () {
          const m = this;
          return Promise.all([protoShutdown(), new Promise(function (resolve, reject) {
            m.httpServer.close(function (error) {
              if (error) {
                reject(error);
              } else {
                delete m.app;
                delete m.httpServer;
                resolve(manager);
              }
            });
          })]);
        }
      },
      toString: {
        value: function () {
          return `${this.name}(${this.httpServerPort})`;
        }
      }
    });

    return manager;
  });
};
