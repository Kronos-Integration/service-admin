/* jslint node: true, esnext: true */

"use strict";

//var views = require('co-views');
//const parse = require('co-body');

exports.initialize = function(manager) {

	return {
		* list(next) {
			this.body = JSON.stringify(Object.keys(manager.flowDefinitions));
		},
		* fetch(id,next) {
			//console.log(`fetch: ${id}`);
			this.body = JSON.stringify(manager.flowDefinitions[id]);
		}
		};
};
