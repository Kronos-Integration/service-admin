/* jslint node: true, esnext: true */

"use strict";

const fs = require('fs'),
	path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

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

function registerModules(manager, modules) {
	try {
		modules.forEach(
			name => {
				try {
					const m = require(name);
					if (m) {
						m.registerWithManager(manager);
					} else {
						console.log(`error in ${name}`);
					}
				} catch (e) {
					console.log(e);
				}
			});
	} catch (e) {
		console.log(e);
	}
}

module.exports.defaultPort = 10000;

module.exports.registerWithManager = function (manager) {
	registerModules(manager, ['kronos-flow', 'kronos-http-routing-step', 'kronos-flow-control-step',
		'kronos-adapter-inbound-http'
	]);

	const koaService = manager.serviceGet('koa-service');

	const adminService = service.createService('admin', {
		port: exports.defaultPort,
		___start() {
			return koaService.start().then(service => loadFlow(manager, path.join(__dirname, '..', 'admin.flow')).then(flow =>
				flow.start()));
		}
	}, koaService);

	adminService.koa.use(route.get('/health', function (ctx) {
		ctx.body = "OK";
	}));

	manager.serviceRegister(adminService);
};
