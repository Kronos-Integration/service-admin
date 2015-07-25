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
		}, * fetch(id, next) {
			this.body = manager.flowDefinitions[id];
		}, * delete(id, next) {
			manager.deleteFlow(id);
			this.body = {};
		}, * insert(id, next) {
			console.log("insert flow");
		},
		* ws(next) {
			let websocket = this.websocket;
			let flowDeclaredListener;
			let endpointSchemeRegisteredListener;
			manager.addListener('flowDeclared', flowDeclaredListener = function (flow) {
				websocket.send('flowDeclared');
	    });

	    manager.addListener('endpointSchemeRegistered', endpointSchemeRegisteredListener = function (endpointScheme) {
				websocket.send('endpointSchemeRegistered');
	    });

			websocket.on('message', function (message) {
				console.log(message);
			});

			websocket.on('close', function (message) {
				websocket = undefined;
				manager.removeListener('flowDeclared',flowDeclaredListener);
				manager.removeListener('endpointSchemeRegistered',endpointSchemeRegisteredListener);
			});

			yield next;
		}
	};
};
