#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const cs = require('./consulService');
const consul = cs.consul;

const koa = require('koa');
const mount = require('koa-mount');
const defaultKronosPort = 10000;

exports.manager = function (options) {
	return kronos.manager(options).then(function (manager) {
		const port = defaultKronosPort;

		const kronosService = cs.service({
			"name": "kronos",
			"notes": "kronos manager",
			"port": port,
			//"ttl": "30s",
			"check": {
				"id": "kronos-check",
				"http": `http://localhost:${port}/health`,
				"interval": "10s",
				"timeout": "1s"
			}
		});

		manager.consul = {
			services: {}
		};

		manager.consul.services[kronosService.name] = kronosService;

		/*
				manager.consul.checkerInterval = setInterval(function () {
					kronosService.markCheckAsPassed();
				}, 29000);
		*/

		process.on('exit', function () {
			kronosService.deregister();
		});

		manager.app = koa();
		const healthApp = koa();
		healthApp.use(function* (next) {
			yield next;
			this.body = 'OK';
			console.log("health ok");
		});

		manager.app.use(mount('/health', healthApp));
		manager.app.listen(port);

		return kronosService.register();
	});
};

/*
consul.status.leader(function (err, result) {
  console.log(`Leader: ${err} ${result}`);
});
*/
