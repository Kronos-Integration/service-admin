/* jslint node: true, esnext: true */

"use strict";

//var views = require('co-views');
//const parse = require('co-body');


module.exports.status = function * list(next) {
	this.body = "OK";
};
