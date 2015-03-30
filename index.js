#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

let http = require('http');
let consul = require('consul')();

const port = 10000;

const serviceName = "Summarizer Service";
const serviceId = "sum";
const checkName = "sum_check";


let check = {
	"name": checkName,
	"serviceid": serviceId,
	"ttl": "15s",
	"http": "http://localhost:" + port
};

consul.agent.service.register({
	"name": serviceName,
	"id": serviceId,
	"notes": "summarizer service",
	"port": port,
	"check": check,
	"tags": ["consumer", "singleton"],
}, function(err) {
	if (err) {
		console.log(err);
		return;
	}

	let server = http.createServer(function(request, response) {
		response.writeHead(200, {
			"Content-Type": "text/html"
		});
		response.end("sum: xxx");
	});

	server.listen(port);

	console.log("service: port=" + port);

	/*
	  consul.agent.check.register(check, function(err) {
	    if (err) {
	      console.log(err);
	      return;
	    }

	    consul.agent.check.pass(checkName, function() {
	      console.log("check passed");
	    });
	  });
	*/



});


function unregister() {
	consul.agent.service.deregister(serviceId, function(err) {
		if (err) {
			console.log(err);
			return;
		}
		console.log("deregister service");
	});
}

process.on('exit', unregister);


/*
consul.agent.self(function(err, result) {
	if (err) {
		console.log(err);
		return;
	}

	console.log('result: ' + JSON.stringify(result));
});

consul.agent.members(function(err, result) {
	if (err) {
		console.log(err);
		return;
	}

	console.log('result: ' + JSON.stringify(result));
});
*/

consul.catalog.node.services('mbpmarkus', function(err, result) {
	if (err) {
		console.log(err);
		return;
	}

	console.log('result: ' + JSON.stringify(result));
});
