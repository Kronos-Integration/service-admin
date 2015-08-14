/* jslint node: true, esnext: true */

"use strict";

const request = require('request');
const url = require('url');
const route = require('koa-route');

module.exports = {
	"direction": "in(passive),out(active)",
	implementation(manager, generator) {
		if (this.isInAndCanBePassive) {
			const endpointId = this.target.split(/:/)[1];

			const go = generator();

			let handler = function () {
				return { * aName(next) {
						this.body = "OK";
						console.log(`Got request ${endpointId}`);
						go.next({
							info: {},
							stream: "something"
						});
					}
				};
			};

			console.log(`create endpoint: ${this.direction} ${generator ? 'gen' : 'nogen'} ${this.target} -> ${endpointId}`);

			manager.app.use(route.post(`/endpoints/${endpointId}`, handler));

			go.next();

			return go;
		} else
		if (this.isOutAndCanBeActive) {
			let url = this.target;
			url = url.replace(/^kronos\+/, '');

			console.log(`create endpoint: ${this.direction} ${generator ? 'gen' : 'nogen'} ${url}`);

			const myGen = function* () {
				let r = yield;
				request.post({
						url: this.target,
						formData: {
							content: r.stream,
						}
					},
					function optionalCallback(err, httpResponse, body) {
						console.log(`http post done: ${err}`);
					});
			};
			const go = myGen();
			go.next();
			return go;
		}
		else {
			throw(new Error(`No matching direction found ${this.direction}`));
		}
	}
};
