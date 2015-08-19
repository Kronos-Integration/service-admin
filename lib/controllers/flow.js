/* jslint node: true, esnext: true */

"use strict";

const getRawBody = require('raw-body');

//var views = require('co-views');

exports.initialize = function (manager) {

	return { * list(next) {
		this.body = Object.keys(manager.flowDefinitions).map(function(id) {
			const flow = manager.flowDefinitions[id];
			return {
				url: id,
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
			try {
				const json = JSON.parse(raw);
				manager.declareFlows(json);
				this.body = {};
			}
			catch(e) {
				this.body = e;
			}
			
			// console.log(`insert flow: ${JSON.stringify(json)}`);
			// curl http://--data '{ "a": { "steps":{} }}' http://localhost:10000/flows
		},
		* ws(next) {
			let websocket = this.websocket;

			const listeners = {};

			function addListener(name, func) {
				listeners[name] = func;
				manager.addListener(name, func);
			}

			addListener('flowDeclared', function (flow) {
				websocket.send(JSON.stringify({ type: "flowDeclared", "flow": flow.name }));
	    });
			addListener('flowDeleted', function (flow) {
				websocket.send(JSON.stringify({ type: "flowDeleted", "flow": flow.name }));
	    });
	    addListener('endpointSchemeRegistered', function (endpointScheme) {
				websocket.send(JSON.stringify({ type: "endpointSchemeRegistered", "endpointScheme": endpointScheme.name }));
	    });

			websocket.on('message', function (message) {
				console.log(message);
			});

			websocket.on('close', function (message) {
				websocket = undefined;
				for(let name in listeners) {
					manager.removeListener(name,listeners[name]);
				}
			});

			yield next;
		}
	};
};
