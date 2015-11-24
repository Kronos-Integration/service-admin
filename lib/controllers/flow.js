/* jslint node: true, esnext: true */

"use strict";

const getRawBody = require('raw-body'),
	sr = require('scope-reporter'),
	kronosStep = require('kronos-step');

exports.initialize = function (manager) {
	/**
	 * @api {get} /flows/ Request flow list
	 * @apiGroup Flow
	 *
	 * @apiSuccess {String} url url of the Flow.
	 * @apiSuccess {String} name name of the Flow.
	 */
	return { * list(next) {
				this.body = Object.keys(manager.flows).map(function (id) {
					const json = manager.flows[id].toJSONWithOptions({
						includeRuntimeInfo: true,
						includeName: true,
						includeDefaults: true
					});
					json.url = id;
					return json;
				});
			},
			/**
			 * @api {get} /flows/:id Request flow information
			 * @apiGroup Flow
			 *
			 * @apiParam {Number} id Flow unique ID.
			 * @apiSuccess {Object} JSON Flow definition.
			 */
			* fetch(id, next) {
				this.body = manager.flows[id].toJSONWithOptions({
					includeRuntimeInfo: true,
					includeName: true,
					includeDefaults: true
				});
			}, * start(id, next) {
				manager.flows[id].start().then(function () {
					// TODO what to do with the returned promise ?
					console.log(`flow has been started: ${id}`);
				});
			}, * stop(id, next) {
				manager.flows[id].stop().then(function () {
					// TODO what to do with the returned promise ?
					console.log(`flow has been stoppen: ${id}`);
				});
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
					yield manager.registerFlow(manager.getStepInstance(json), sr.createReporter(kronosStep.ScopeDefinitions, function (
						reporter) {
						const flowName = reporter.scope('step').values.name;
						result[flowName] = {
							scope: reporter.toJSON()
						};
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

				addListener('stepStateChanged', function (step, oldState, newState) {
					websocket.send(JSON.stringify({
						type: "stepStateChanged",
						"step": step.name
					}));

					if (newState === 'deleted') {
						websocket.send(JSON.stringify({
							type: "stepDeleted",
							"step": step.name
						}));
					}
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
