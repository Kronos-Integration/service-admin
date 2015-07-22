#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const cs = require('./consulService');
const consul = cs.consul;

const koa = require('koa');
const route = require('koa-route');
const jwt = require('koa-jwt');
const websockify = require('koa-websocket');

exports.defaultKronosPort = 10000;

const kronosCheckInterval = 10;

exports.manager = function (options) {
  const consulOptions = options.consul || {};

  let dataCenter = consulOptions.dataCenter;

  return kronos.manager(options).then(function (manager) {

    manager.addListener('flowDeclared', function (flow) {
      console.log(`new flow: ${flow.name} ${JSON.stringify(flow)}`);
    });

    manager.addListener('endpointSchemeRegistered', function (endpointScheme) {
      console.log(`new endpoint scheme: ${endpointScheme.name}`);
    });

    manager.addListener('stepImplementationRegistered', function (step) {
      kronosService.tags = Object.keys(manager.stepImplementations);
      kronosService.update(1000);
    });

    manager.consul = {
      services: {},
      nodes: {}
    };

    const stepNames = Object.keys(manager.stepImplementations);

    const port = options.port || exports.defaultKronosPort;

    const healthMountPoint = '/health';
    const kronosService = cs.service({
      "name": "kronos",
      "notes": "kronos manager",
      "port": port,
      "tags": stepNames,
      "check": {
        "id": "kronos-check",
        "http": `http://localhost:${port}${healthMountPoint}`,
        "interval": `${kronosCheckInterval}s`,
        "timeout": "1s"
      }
    });

    manager.consul.services[kronosService.name] = kronosService;

    const app = websockify(koa());
    manager.app = app;

    /*
        app.use(jwt({
          secret: 'shared-secret'
        }).unless({
          path: [/^\/health/, '/']
        }));
    */

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

    manager.httpServer = app.listen(port);

    const protoShutdown = manager.shutdown;

    manager.shutdown = function () {
      return Promise.all([kronosService.deregister(), protoShutdown(), new Promise(function (resolve, reject) {
        manager.httpServer.close(function (error) {
          if (error) {
            reject(error);
          } else {
            delete manager.consul.services[kronosService.name];
            delete manager.app;
            delete manager.httpServer;

            resolve(manager);
          }
        });
      })]);
    };

    function getKronosNodes() {
      const o = {
        dc: dataCenter,
        service: kronosService.name
      };

      consul.catalog.service.nodes(o, function (error, data) {
        if (error) {
          console.log(`services: ${error}`);
        } else {
          data.forEach(function (node) {
            manager.consul.nodes[node.Node] = node;
            //console.log(`${node.Node}`);
          });

          //console.log(`services: ${JSON.stringify(data)}`);
        }
      });
    }

    return new Promise(function (resolve, reject) {
      kronosService.register().then(function () {

        if (dataCenter) {
          getKronosNodes();
        } else {
          consul.catalog.datacenters(function (error, data) {
            if (error) {
              console.log(`datacenters: ${error}`);
              reject(error);
              return;
            }
            //console.log(`datacenters: ${JSON.stringify(data)}`);

            dataCenter = data[0];
            getKronosNodes();
          });
        }

        resolve(manager);
      });
    });
  });
};
