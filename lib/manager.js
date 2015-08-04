/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');

const koa = require('koa');
const route = require('koa-route');
const jwt = require('koa-jwt');
const websockify = require('koa-websocket');

exports.defaultKronosPort = 10000;

exports.manager = function (options) {
  return kronos.manager(options).then(function (manager) {
    const stepNames = Object.keys(manager.stepImplementations);

    const port = options.port || exports.defaultKronosPort;

    const healthMountPoint = '/health';

    const app = websockify(koa());
    manager.app = app;

    const hc = require('./controllers/health').initialize(manager);
    app.use(route.get(healthMountPoint, hc.status));

    const sc = require('./controllers/state').initialize(manager);
    app.use(route.get('/state', sc.list));
    app.ws.use(route.all('/state', sc.ws));

    const fc = require('./controllers/flow').initialize(manager);
    app.use(route.get('/flows', fc.list));
    app.use(route.get('/flows/:id', fc.fetch));
    app.use(route.delete('/flows/:id', fc.delete));
    app.use(route.post('/flows', fc.insert));
    app.ws.use(route.all('/flows', fc.ws));

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
