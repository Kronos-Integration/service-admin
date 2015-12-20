/* jslint node: true, esnext: true */

"use strict";

const fs = require('fs'),
	path = require('path'),
	service = require('kronos-service');

function loadFlow(manager, fileName) {
	// load and start admin flow
	return new Promise(function (resolve, reject) {
		fs.readFile(fileName, {
			encoding: 'utf8'
		}, function (err, data) {
			if (err) {
				reject(err);
				return;
			}
			try {
				resolve(manager.registerFlow(manager.getStepInstance(JSON.parse(data))));
			} catch (err) {
				reject(err);
				return;
			}
		});
	});
}


exports.registerWithManager = function (manager) {

	['kronos-flow', 'kronos-http-routing-step', 'kronos-flow-control-step', 'kronos-adapter-inbound-http'].forEach(name =>
		require(
			name).registerWithManager(manager));

	const koaService = manager.servideGet('koa-service');

	const adminService = service.createService('admin', {
		port: 10000,
		_start() {
			return koaService.start().then(service => loadFlow(manager, path.join(__dirname, '..', 'admin.flow')).then(flow =>
				flow.start()));
		}
	}, koaService);

	manager.serviceRegister(adminService);
};
