#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const http = require('http');
const consul = require('consul')();
const Promise = require("Promise");

const defaultDonkeyNodeServicePort = 10000;

exports.manager = function (options) {
	return kronos.manager(options).then(function (manager) {

		manager.consul = {
			services: {
				kronos: {
					"serviceid": "kronos-node",
					"name": "kronos-node",

					check: {
						"name": "donkey-node-check",
						"ttl": "30s",
						"serviceid": "kronos-node"
					},
					status: {}
				}
			}
		};

		return new Promise(function (resolve, reject) {

			registerDonkeyNodeService(manager, function (err) {
				if (err) {
					console.log(`registerDonkeyNodeService: ${err}`);
					reject(err);
					return;
				}

				console.log(`${manager.consul.services.kronos.name} registered`);

				registerDonkeyNodeCheck(manager, function (err) {
					if (err) {
						console.log(`registerDonkeyNodeCheck: ${err}`);

						reject(err);
						return;
					}
					console.log(`${manager.consul.services.kronos.check.name} registered`);
				});
			});

			function unregisterKronosService() {
				consul.agent.service.deregister(manager.consul.services.kronos.name, function (err) {
					if (err) {
						console.log(err);
						return;
					}
					console.log("deregister service");
				});
			}

			process.on('exit', unregisterKronosService);

			resolve(manager);
		});
	});
};

/*
consul.status.leader(function (err, result) {
  console.log(`Leader: ${err} ${result}`);
});
*/

function registerDonkeyNodeCheck(manager, cb) {
	consul.agent.check.list(function (err, result) {
		if (err) {
			cb(err);
			return;
		}

		const myCheck = result[manager.consul.services.kronos.check.name];

		if (myCheck) {
			manager.consul.nodeService.status = myCheck;

			console.log(
				`${manager.consul.services.kronos.check.name} already defined (${myCheck.Status}): ${JSON.stringify(myCheck)}`
			);

			cb(undefined);
		} else {
			consul.agent.check.register(manager.consul.services.kronos.check, cb);
		}

		manager.consul.checkerInterval = setInterval(function () {
			consul.agent.check.pass(manager.consul.services.kronos.check.name, function (
				err) {
				if (err) {
					return;
				}
				consul.agent.check.list(function (err, result) {
					const myCheck = result[manager.consul.services.kronos.check.name];
					if (myCheck) {
						manager.consul.services.kronos = myCheck;
						console.log(
							`${manager.consul.services.kronos.check.name} (${myCheck.Status}): ${JSON.stringify(myCheck)}`
						);
					}
				});

			});
		}, 29000);
	});
}

function registerDonkeyNodeService(manager, cb) {

	let port = defaultDonkeyNodeServicePort;

	function donkeyNodeService() {
		let server = http.createServer(function (request, response) {
			response.writeHead(200, {
				"Content-Type": "text/html"
			});
			response.end("ok");
			console.log("check");
		});

		server.listen(port);

		console.log(`${manager.consul.services.kronos.name} started: port=${port}`);

		return server;
	}

	consul.agent.service.list(function (err, result) {
		if (err) {
			cb(err);
			return;
		}

		const myService = result[manager.consul.services.kronos.name];
		if (myService) {
			console.log(
				`${manager.consul.services.kronos.name} already defined Port=${myService.Port}`
			);
			console.log(
				`${manager.consul.services.kronos.name}: ${JSON.stringify(myService)}`
			);

			port = myService.Port;
		} else {

			consul.agent.service.register({
				"name": manager.consul.services.kronos.name,
				"serviceid": manager.consul.services.kronos.serviceid,
				"notes": "kronos node",
				"port": port,
				"check": manager.consul.services.kronos.check,
				"tags": ["kronos"],
			}, cb);
		}

		cb(undefined, donkeyNodeService());

		//console.log(`list services: ${err} : ${JSON.stringify(result)}`);
	});
}
