#!/usr/bin/env iojs

/* jslint node: true, esnext: true */

"use strict";


var consul = require('consul')();

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


consul.agent.service.register({
	"name": "example",
	"notes": "example service"
}, function(err) {
	if (err) {
		console.log(err);
		return;
	}
});
*/

consul.catalog.node.services('mbpmarkus', function(err, result) {
  if (err) {
    console.log(err);
    return;
  }

  console.log('result: ' + JSON.stringify(result));
});
