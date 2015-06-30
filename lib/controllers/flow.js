/* jslint node: true, esnext: true */

"use strict";

//var views = require('co-views');
//const parse = require('co-body');

exports.initialize = function (manager) {

	return { * list(next) {
		this.body = Object.keys(manager.flowDefinitions).map(function(id) {
			const flow = manager.flowDefinitions[id];
			return {
				id: id,
				name: flow.name,
				description: flow.description
			};
		});

			//this.body = JSON.stringify(Object.keys(manager.flowDefinitions));
		}, * fetch(id, next) {
			//console.log(`fetch: ${id}`);
			this.body = manager.flowDefinitions[id];
		}, * delete(id, next) {
			manager.deleteFlow(id);
		}, * insert(id, next) {
			console.log("insert flow");
		}
	};
};
