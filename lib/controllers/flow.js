/* jslint node: true, esnext: true */

"use strict";

//var views = require('co-views');
//const parse = require('co-body');

var flows = { "flow1" : { name: "flow1" }, "flow2" : { name: "flow2" }
};

module.exports.list = function * list(next) {
	this.body = JSON.stringify(flows);
};

module.exports.fetch = function * fetch(id,next) {
	console.log(`fetch: ${id}`);
	this.body = JSON.stringify(flows[id]);
};
