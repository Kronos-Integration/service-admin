#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";

let http = require('http');
let consul = require('consul')();

const port = 10000;

consul.agent.service.register({
  "name": "sum",
  "notes": "summarizer service",
  "port": port,
  "tags": ["consumer"],
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
});

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
