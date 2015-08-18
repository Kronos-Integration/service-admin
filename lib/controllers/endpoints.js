/* jslint node: true, esnext: true */

"use strict";

exports.initialize = function(manager) {
	return {
		* list(next) {
			this.body = {
				"0001" : {}
			};
		}
	};
};
