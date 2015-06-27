/* jslint node: true, esnext: true */

"use strict";

const process = require('process');

//var views = require('co-views');
//const parse = require('co-body');

exports.initialize = function(manager) {
	return {
		* list(next) {
			this.body = JSON.stringify({
				versions: process.versions,
				platform: process.platform,
				uptime: process.uptime(),
				memory: process.memoryUsage()
			});
		}
	};
};
