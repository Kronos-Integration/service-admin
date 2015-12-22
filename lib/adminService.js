/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

module.exports.registerWithManager = function (manager) {
	manager.registerModules(['kronos-flow', 'kronos-http-routing-step', 'kronos-flow-control-step',
		'kronos-adapter-inbound-http'
	]);

	const koaService = manager.serviceGet('koa-service');

	const adminService = manager.serviceDeclare('koa-service', {
		name: 'admin',
		_start() {
			return koaService.start().then(service => manager.loadFlowFromFile(path.join(__dirname, '..', 'admin.flow')).then(
				flow =>
				flow.start()));
		}
	});

	adminService.koa.use(route.get('/health', ctx => {
		ctx.body = "OK";
	}));

};
