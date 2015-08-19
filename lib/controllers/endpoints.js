/* jslint node: true, esnext: true */

"use strict";

exports.initialize = function(manager) {
	const controller = {
		endpoints : {},

		* list(next) {
			this.body = {}; //controller.endpoints;
		}
	};

	return controller;
};
