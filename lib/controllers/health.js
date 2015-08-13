/* jslint node: true, esnext: true */

"use strict";

exports.initialize = function(manager) {
	return {
		* status(next) {
			// TODO figure out health status
			this.body = "OK";
		}
	};
};
