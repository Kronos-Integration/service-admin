/* jslint node: true, esnext: true */

"use strict";

const fs = require('fs'),
	path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

module.exports.defaultPort = 10000;

module.exports.registerWithManager = function (manager) {
	manager.registerModules(['kronos-flow', 'kronos-http-routing-step', 'kronos-flow-control-step',
		'kronos-adapter-inbound-http'
	]);

	const koaService = manager.serviceGet('koa-service');

	const adminService = service.createService('admin', {
		port: exports.defaultPort,
		___start() {
			return koaService.start().then(service => manager.loadFlowFromFile(path.join(__dirname, '..', 'admin.flow')).then(
				flow =>
				flow.start()));
		}
	}, koaService);

	adminService.koa.use(route.get('/health', function (ctx) {
		ctx.body = "OK";
	}));

	manager.serviceRegister(adminService);
};
