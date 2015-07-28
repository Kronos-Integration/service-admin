/* jslint node: true, esnext: true */

"use strict";

const getRawBody = require('raw-body');

//var views = require('co-views');

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
			manager.deleteFlow(id).then(function() {
				// TODO what to do with the returned promise ?
				console.log(`flow has been deleted: ${id}`);
				});
			this.body = {};
		}, * insert(next) {
			const raw = yield getRawBody(this.req, {
		    length: this.length,
		    limit: '1mb',
		    encoding: this.charset
		  });
			const json = JSON.parse(raw);

			console.log(`insert flow: ${JSON.stringify(json)}`);

			manager.declareFlows(json);

			this.body = {};

			// curl http://--data '{ "a": { "steps":{} }}' http://localhost:10000/flows
		},
		* ws(next) {
			let websocket = this.websocket;
			let flowDeclaredListener,flowDeletedListener;
			let endpointSchemeRegisteredListener;
			manager.addListener('flowDeclared', flowDeclaredListener = function (flow) {
				websocket.send(JSON.stringify({ message: "flowDeclared", flow: flow.id }));
	    });
			manager.addListener('flowDeleted', flowDeletedListener = function (flow) {
				websocket.send(JSON.stringify({ message: "flowDeleted", flow: flow.id }));
	    });

	    manager.addListener('endpointSchemeRegistered', endpointSchemeRegisteredListener = function (endpointScheme) {
				websocket.send(JSON.stringify({ message: "endpointSchemeRegistered", endpointScheme: endpointScheme.name }));
	    });

			websocket.on('message', function (message) {
				console.log(message);
			});

			websocket.on('close', function (message) {
				websocket = undefined;
				manager.removeListener('flowDeclared',flowDeclaredListener);
				manager.removeListener('flowDeleted',flowDeletedListener);
				manager.removeListener('endpointSchemeRegistered',endpointSchemeRegisteredListener);
			});

			yield next;
		}
	};
};
