/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');

const koa = require('koa');
const route = require('koa-route');
const jwt = require('koa-jwt');
const websockify = require('koa-websocket');

exports.defaultKronosPort = 10000;

exports.manager = function (manager,options) {
  return kronos.manager(options).then(function (manager) {
    if(!options) { 
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
    if(options.jwt) {
      app.use(jwt({ secret: options.jwt.secret }));
    }

    const sc = require('./controllers/state').initialize(manager);
    app.use(route.get('/state', sc.list));
    app.ws.use(route.all('/state', sc.ws));

    const fc = require('./controllers/flow').initialize(manager);
    app.use(route.get('/flows', fc.list));
    app.use(route.get('/flows/:id', fc.fetch));
    app.use(route.delete('/flows/:id', fc.delete));
    app.use(route.post('/flows', fc.insert));
    app.ws.use(route.all('/flows', fc.ws));

/*
    const ec = require('./controllers/endpoint').initialize(manager);
    app.use(route.get('/endpoints/:id', fc.fetch));
    app.use(route.post('/endpoints/:id', fc.post));
*/

    manager.httpServerPort = port;
    manager.httpServer = app.listen(port);

    const protoShutdown = manager.shutdown;

    manager.shutdown = function () {
      return Promise.all([protoShutdown(), new Promise(function (resolve, reject) {
        manager.httpServer.close(function (error) {
          if (error) {
            reject(error);
          } else {
            delete manager.app;
            delete manager.httpServer;

            resolve(manager);
          }
        });
      })]);
    };

    return manager;
  });
};
