/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	process = require('process'),
	ssh2 = require('ssh2'),
	endpoint = require('kronos-endpoint'),
	service = require('kronos-service');

/**
 *
 */
class ServiceAdmin extends service.Service {
	static get name() {
		return "admin";
	}

	get type() {
		return ServiceAdmin.name;
	}

	constructor(config, owner) {
		super(config, owner);

		this.addEndpoint(new endpoint.ReceiveEndpoint('software', this)).receive = request => Promise.resolve({
			versions: process.versions,
			platform: process.platform
		});
	}

	get autostart() {
		return true;
	}

	_start() {
		return super._start().then(() => {
			return service.ServiceConsumerMixin.defineServiceConsumerProperties(this, {
				"listener": {
					name: "koa-admin",
					type: "koa",
					io: {}
				}
			}, this.owner, true).then(() => {
				this._stepStateChangedListener = (step, oldState, newState) => {
					this.listener.endpoints.io.receive({
						event: 'stepStateChanged',
						data: {
							oldState: oldState,
							newState: newState
						}
					});
				};

				this.owner.addListener('stepStateChanged', this._stepStateChangedListener);

				if (this.config.ssh) {
					this.sshServer = require('./ssh')(this, this.config.ssh);
				}

				return this.owner.loadFlowFromFile(path.join(__dirname, '..', 'admin.flow'));
			});
		});
	}

	_stop() {
		this.owner.removeListener('stepStateChanged', this._stepStateChangedListener);

		if (this.sshServer) {
			return super._stop().then(new Promise((fullfill, reject) => {
				this.sshServer.close((err) => {
					if (err) {
						reject(err);
						return;
					}
					delete this.sshServer;
					fullfill();
				});
			}));
		}

		return super._stop();
	}
}

module.exports.registerWithManager = manager =>
	manager.registerServiceFactory(ServiceAdmin).then(admin =>
		manager.declareService({
			'type': admin.name,
			'name': admin.name
		}));
