#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const cs = require('./consulService');
const consul = cs.consul;

const koa = require('koa');
const mount = require('koa-mount');
const defaultKronosPort = 10000;
const kronosCheckInterval = 10;

exports.manager = function (options) {
  const consulOptions = options.consul || {
    dc: "MF"
  };

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

    manager.app = koa();
    const healthApp = koa();
    healthApp.use(function* (next) {
      yield next;
      this.body = 'OK';
    });

    manager.app.use(mount(healthMountPoint, healthApp));


    const flowApp = koa();
    flowApp.use(function* (next) {
      yield next;
      this.body = 'OK';
    });

    manager.app.use(mount('/flow', flowApp));


    manager.app.listen(port);

    return new Promise(function (resolve) {
      kronosService.register().then(function () {

        //console.log(`consul: ${JSON.stringify(consulOptions)}`);

        consul.catalog.service.list(consulOptions, function (error, data) {
          if (error) {
            console.log(`services: ${error}`);
            return;
          }
          console.log(`services: ${JSON.stringify(data)}`);
        });

        consul.catalog.node.list(consulOptions,
          function (error, data) {
            if (error) {
              console.log(`nodes: ${error}`);
              return;
            }
            console.log(`nodes: ${JSON.stringify(data)}`);
          });

        resolve(manager);
      });
    });
  });
};
