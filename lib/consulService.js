/* jslint node: true, esnext: true */

"use strict";

const consul = require('consul')();
const Promise = require("Promise");


const rootService = {
	toString: function () {
		return this.name;
	},
	consulDefinition: function () {
		return {
			name: this.name,
			serviceid: this.serviceid,
			check: this.check,
			port: this.port,
			tags: this.tags,
			notes: this.notes
		};
	},
	register: function () {
		const service = this;
		return new Promise(function (resolve, reject) {
			consul.agent.service.register(service.consulDefinition(), function (error) {
				if (error) {
					console.log(`error registering: ${service} ${error}`);
					reject(error);
				} else {
					console.log(`registered: ${service}`);
					resolve(service);
				}
			});
		});
	},
	deregister: function () {
		const service = this;
		return new Promise(function (resolve, reject) {
			consul.agent.service.deregister(service.name, function (error) {
				if (error) {
					console.log(`error deregistering: ${service} ${error}`);
					reject(error);
				} else {
					console.log(`deregistered: ${service}`);
					resolve(service);
				}
			});
		});
	},
	markCheckAsPassed: function () {
		const service = this;
		consul.agent.check.pass(this.check.name, function (
			err) {
			console.log(`check market as passed: ${service} ${err}`);
		});
	}
};


exports.service = function (options) {
	const name = options.name;
	const serviceid = options.serviceid | name;
	const port = options.port;
	const notes = options.notes;
	const tags = options.tags;
	const check = options.check;

	if (check) {
		if (check.serviceid === undefined) {
			check.serviceid = serviceid;
		}
	}

	const properties = {
		name: {
			value: name
		},
		serviceid: {
			value: serviceid
		},
		port: {
			value: port
		},
		check: {
			value: check
		},
		notes: {
			value: notes
		},
		tags: {
			value: tags
		}
	};

	const service = Object.create(rootService, properties);

	return service;
};

exports.consul = consul;
