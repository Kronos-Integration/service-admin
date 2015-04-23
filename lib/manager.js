#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const http = require('http');
const consul = require('consul')();
const Promise = require("Promise");


const donkeyNodeServiceName = "donkey-node";
const donkeyNodeServiceId = donkeyNodeServiceName;
const donkeyNodeServiceCheckName = "donkey-node-check";
const defaultDonkeyNodeServicePort = 10000;

const donkeyNodeServiceCheck = {
	"name": donkeyNodeServiceCheckName,
	"ttl": "30s",
	"serviceid": donkeyNodeServiceId
};

exports.manager = function (options) {
	return kronos.manager(options).then(function (manager) {
		return new Promise(function (resolve, reject) {

			registerDonkeyNodeService(function (err) {
				if (err) {
					console.log(`registerDonkeyNodeService: ${err}`);
					reject(err);
					return;
				}

				console.log(`${donkeyNodeServiceName} registered`);

				registerDonkeyNodeCheck(function (err) {
					if (err) {
						console.log(`registerDonkeyNodeCheck: ${err}`);

						reject(err);
						return;
					}
					console.log(`${donkeyNodeServiceCheckName} registered`);
				});
			});
			resolve(manager);
		});
	});
};


function unregisterDonkeyNodeService() {
	consul.agent.service.deregister(donkeyNodeServiceId, function (err) {
		if (err) {
			console.log(err);
			return;
		}
		console.log("deregister service");
	});
}

process.on('exit', unregisterDonkeyNodeService);

/*
consul.status.leader(function (err, result) {
  console.log(`Leader: ${err} ${result}`);
});
*/

function registerDonkeyNodeCheck(cb) {
	consul.agent.check.list(function (err, result) {
		if (err) {
			cb(err);
			return;
		}

		const myCheck = result[donkeyNodeServiceCheckName];

		if (myCheck) {
			console.log(
				`${donkeyNodeServiceCheckName} already defined (${myCheck.Status}): ${JSON.stringify(myCheck)}`
			);

			cb(undefined);
		} else {
			consul.agent.check.register(donkeyNodeServiceCheck, cb);
		}

		setInterval(function () {
			consul.agent.check.pass(donkeyNodeServiceCheckName, function (
				err) {
				if (err) {
					return;
				}
				consul.agent.check.list(function (err, result) {
					const myCheck = result[donkeyNodeServiceCheckName];
					if (myCheck) {
						console.log(
							`${donkeyNodeServiceCheckName} (${myCheck.Status}): ${JSON.stringify(myCheck)}`
						);
					}
				});

			});
		}, 29000);
	});
}

function registerDonkeyNodeService(cb) {

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

		console.log(`${donkeyNodeServiceName} started: port=${port}`);

		return server;
	}

	consul.agent.service.list(function (err, result) {
		if (err) {
			cb(err);
			return;
		}

		const myService = result[donkeyNodeServiceName];
		if (myService) {
			console.log(
				`${donkeyNodeServiceName} already defined Port=${myService.Port}`
			);
			console.log(
				`${donkeyNodeServiceName}: ${JSON.stringify(myService)}`
			);

			port = myService.Port;
		} else {

			consul.agent.service.register({
				"name": donkeyNodeServiceName,
				"serviceid": donkeyNodeServiceId,
				"notes": "donkey node",
				"port": port,
				"check": donkeyNodeServiceCheck,
				"tags": ["donkey"],
			}, cb);
		}

		cb(undefined, donkeyNodeService());

		//console.log(`list services: ${err} : ${JSON.stringify(result)}`);
	});
}
