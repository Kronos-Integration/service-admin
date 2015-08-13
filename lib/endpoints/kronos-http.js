/* jslint node: true, esnext: true */

"use strict";

const request = require('request');
const url = require('url');
const route = require('koa-route');

module.exports = {
	"direction": "in(active),out(passive)",
	implementation(manager, generator) {
		if (this.isIn) {
			console.log(`create endpoint: ${JSON.stringify(this)}`);

			const go = generator();

			let handler = function () {
				return { * aName(next) {
						this.body = "OK";
						go.next({
							info: {},
							stream: "something"
						});
					}
				};
			};

			// TODO where to get url from ?
			manager.app.use(route.post(`/endpoint/flowB/s1/${this.name}`, handler));

			go.next();

			return go;
		} else
		if (this.isOut) {
			let url = this.target;
			url = url.replace(/^kronos\+/, '');

			console.log(`create endpoint: ${url}`);

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
	}
};
