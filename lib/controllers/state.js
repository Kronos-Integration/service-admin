/* jslint node: true, esnext: true */

"use strict";

const process = require('process');

//var views = require('co-views');
//const parse = require('co-body');

exports.initialize = function(manager) {
	return {
		* list(next) {
			this.body = {
				versions: process.versions,
				platform: process.platform,
				uptime: process.uptime() * 1000,
				memory: process.memoryUsage()
			};
		},
		* ws(next) {
			let websocket = this.websocket;
			let interval = setInterval(function () {
				if (websocket) {
					websocket.send(JSON.stringify({
						uptime: process.uptime() * 1000,
						memory: process.memoryUsage()
					}));
				}
			}, 5000);

			websocket.on('message', function (message) {
				console.log(message);
			});

			websocket.on('close', function (message) {
				if (interval) {
					clearTimeout(interval);
					interval = undefined;
				}
				websocket = undefined;
				console.log('close');
			});

			yield next;
		}
	};
};
