/* jslint node: true, esnext: true */

"use strict";

const getRawBody = require('raw-body');
const sr = require('scope-reporter');

//var views = require('co-views');

exports.initialize = function (manager) {

	return { * list(next) {
			this.body = Object.keys(manager.flowDefinitions).map(function (id) {
				const flow = manager.flowDefinitions[id];
				return {
					url: id,
					name: flow.name,
					description: flow.description,
					state: flow.state
				};
			});
		}, * fetch(id, next) {
			this.body = manager.flowDefinitions[id];
		}, * pause(id, next) {
			manager.flowDefinitions[id].pause();
		}, * start(id, next) {
			manager.flowDefinitions[id].start();
		}, * stop(id, next) {
			manager.flowDefinitions[id].stop();
		}, * delete(id, next) {
			manager.deleteFlow(id).then(function () {
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
				const t = this;
				const json = JSON.parse(raw);
				const result = {};
				this.body = result;
				yield manager.registerFlows(json, sr.createReporter(undefined, function (reporter) {
					const flowName = reporter.scope('flow').values.name;
					result[flowName] = { scope: reporter.toJSON() };
					//t.body = result;
				}));
			} catch (e) {
				this.throw(e, 500);
			}

			// console.log(`insert flow: ${JSON.stringify(json)}`);
			// curl http://--data '{ "a": { "steps":{} }}' http://localhost:10000/flows
		}, * ws(next) {
			let websocket = this.websocket;

			const listeners = {};

			function addListener(name, func) {
				listeners[name] = func;
				manager.addListener(name, func);
			}

			addListener('flowStateChanged', function (flow) {
				websocket.send(JSON.stringify({
					type: "flowStateChanged",
					"flow": flow.name
				}));
			});
			addListener('flowDeleted', function (flow) {
				websocket.send(JSON.stringify({
					type: "flowDeleted",
					"flow": flow.name
				}));
			});
			addListener('endpointSchemeRegistered', function (endpointScheme) {
				websocket.send(JSON.stringify({
					type: "endpointSchemeRegistered",
					"endpointScheme": endpointScheme.name
				}));
			});

			websocket.on('message', function (message) {
				console.log(message);
			});

			websocket.on('close', function (message) {
				websocket = undefined;
				for (let name in listeners) {
					manager.removeListener(name, listeners[name]);
				}
			});

			yield next;
		}
	};
};
