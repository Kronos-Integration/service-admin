#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

let sm = require('service-manager');
let http = require('http');
let consul = require('consul')();


const manager = sm.manager();

const donkeyNodeServiceName = "donkey_node";
const serviceId = donkeyNodeServiceName + "001";
const checkName = "donkey_check";
const defaultDonkeyNodeServicePort = 10000;

let check = {
  "name": checkName,
  "ttl": "15s",
  "http": "http://localhost:" + defaultDonkeyNodeServicePort
};

registerDonkeyNodeService(function (err) {
  if (err) {
    return;
  }
  console.log(`${donkeyNodeServiceName} registerd`);
});



function unregisterDonkeyNodeService() {
  consul.agent.service.deregister(serviceId, function (err) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("deregister service");
  });
}

process.on('exit', unregisterDonkeyNodeService);

consul.status.leader(function (err, result) {
  console.log(`Leader: ${err} ${result}`);
});

/*
consul.catalog.node.services('mbpmarkus', function (err, result) {
	if (err) {
		console.log(err);
		return;
	}

	console.log('result: ' + JSON.stringify(result));
});
*/

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

    console.log("service: port=" + port);

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

      port = myService.Port;
    } else {
      consul.agent.service.register({
        "name": donkeyNodeServiceName,
        "notes": "donkey node",
        "port": port,
        "check": check,
        "tags": ["donkey"],
      }, cb);
    }

    cb(undefined, donkeyNodeService());

    //console.log(`list services: ${err} : ${JSON.stringify(result)}`);
  });
}

/*
consul.agent.check.register(check, function (err) {
	if (err) {
		cb(err);
		return;
	}

	consul.agent.check.list(function (err, result) {
		console.log(
			`list checks: ${JSON.stringify(result)}`);

	});
});

*/
