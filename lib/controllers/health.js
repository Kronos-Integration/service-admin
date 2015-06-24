/* jslint node: true, esnext: true */

"use strict";

//var views = require('co-views');
//const parse = require('co-body');

exports.initialize = function(manager) {
	return {
		* status(next) {
			this.body = "OK";
		}
	};
}
