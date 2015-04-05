#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

let sm = require('service-manager');
let http = require('http');
let consul = require('consul')();

const port = 10000;

const serviceName = "donkey_node";
const serviceId = serviceName + "001";
const checkName = "donkey_check";


let check = {
  "name": checkName,
  "ttl": "15s",
  "http": "http://localhost:" + port
};

consul.agent.service.register({
  "name": serviceName,
  "notes": "donkey node",
  "port": port,
  "check": check,
  "tags": ["donkey"],
}, function (err) {
  if (err) {
    console.log(err);
    return;
  }

  let server = http.createServer(function (request, response) {
    response.writeHead(200, {
      "Content-Type": "text/html"
    });
    response.end("ok");
    console.log("check");
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
  consul.agent.service.deregister(serviceId, function (err) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("deregister service");
  });
}

process.on('exit', unregister);


/*
consul.catalog.node.services('mbpmarkus', function (err, result) {
	if (err) {
		console.log(err);
		return;
	}

	console.log('result: ' + JSON.stringify(result));
});
*/
