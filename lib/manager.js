#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const cs = require('./consulService');
const consul = cs.consul;

const koa = require('koa');
const route = require('koa-route'); << << << < Updated upstream
  === === =
  const jwt = require('koa-jwt');
const flowController = require('./controllers/flow');
const healthController = require('./controllers/health');

>>> >>> > Stashed changes

const defaultKronosPort = 10000;
const kronosCheckInterval = 10;

exports.manager = function (options) {

  const consulOptions = options.consul || {};

  let dataCenter = consulOptions.dataCenter;

  return kronos.manager(options).then(function (manager) {

    manager.addListener('flowDeclared', function (flow) {
      console.log(`new flow: ${flow.name} ${JSON.stringify(flow)}`);
    });

    manager.consul = {
      services: {}
    };

    const stepNames = [];
    for (let name in manager.stepImplementations) {
      stepNames.push(name);
    }

    const port = defaultKronosPort;
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

    process.on('exit', function () {
      kronosService.deregister();
    });

    const app = koa();
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

    const sc = require('./controllers/status').initialize(manager);
    app.use(route.get('/status', sc.list));

    const fc = require('./controllers/flow').initialize(manager);
    app.use(route.get('/flows', fc.list));
    app.use(route.get('/flows/:id', fc.fetch));

    app.listen(port);

    function getKronosNodes() {
      const o = {
        dc: dataCenter,
        service: kronosService.name
      };
      //console.log(`consul: ${JSON.stringify(o)}`);

      consul.catalog.service.list(o, function (error, data) {
        if (error) {
          console.log(`services: ${error}`);
          return;
        }
        console.log(`services: ${JSON.stringify(data)}`);
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

        consul.catalog.node.list(consulOptions,
          function (error, data) {
            if (error) {
              console.log(`nodes: ${error}`);
              reject(error);
              return;
            }
            console.log(`nodes: ${JSON.stringify(data)}`);
          });

        resolve(manager);
      });
    });
  });
};
