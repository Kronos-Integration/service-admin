/* jslint node: true, esnext: true */

'use strict';

const path = require('path'),
	process = require('process'),
	ssh2 = require('ssh2'),
	mat = require('model-attributes'),
	endpoint = require('kronos-endpoint'),
	service = require('kronos-service');

/**
 *
 */
class ServiceAdmin extends service.Service {
	static get name() {
		return 'admin';
	}
	static get configurationAttributes() {
		return Object.assign(mat.createAttributes({
			ssh: {
				description: 'ssh admin interface',
				attributes: {
					port: {
						description: 'listen port',
						needsRestart: true,
						type: 'ip-port'
					},
					hostKeys: {
						description: 'server ssh private host key(s)',
						type: 'blob',
						needsRestart: true
					}
				}
			}
		}), service.Service.configurationAttributes);
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
				listener: {
					name: 'koa-admin',
					type: 'koa'
				}
			}, this.owner, true).then(() => {
				if (this.config.ssh) {
					this.sshServer = require('./ssh')(this, this.config.ssh);
				}

				return this.owner.loadFlowFromFile(path.join(__dirname, '..', 'admin.flow'));
			});
		});
	}

	_stop() {
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
			type: admin.name,
			name: admin.name
		}));
