/* jslint node: true, esnext: true */

"use strict";

const getRawBody = require('raw-body'),
	scopeReporter = require('scope-reporter'),
	kronosStep = require('kronos-step');

exports.initialize = function (manager) {
	/**
	 * @api {get} /flows/ Request flow list
	 * @apiGroup Flow
	 *
	 * @apiSuccess {String} url url of the Flow.
	 * @apiSuccess {String} name name of the Flow.
	 */
	return { * ws(next) {
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
