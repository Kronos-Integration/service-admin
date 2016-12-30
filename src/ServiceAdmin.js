/* jslint node: true, esnext: true */

'use strict';

const path = require('path'),
	process = require('process');

import {
	sshServer
}
from './ssh';

import { 
	mergeAttributes, createAttributes
}
from 'model-attributes';

import {
	ReceiveEndpoint
}
from 'kronos-endpoint';

import {
	Service, defineServiceConsumerProperties
}
from 'kronos-service';

/**
 *
 */
class ServiceAdmin extends Service {
	static get name() {
		return 'admin';
	}

	static get configurationAttributes() {
		return mergeAttributes(createAttributes({
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
		}), Service.configurationAttributes);
	}

	constructor(config, owner) {
		super(config, owner);

		this.addEndpoint(new ReceiveEndpoint('software', this)).receive = request => Promise.resolve({
			versions: process.versions,
			platform: process.platform
		});
	}

	get autostart() {
		return true;
	}

	_start() {
		return super._start().then(() => {
			return defineServiceConsumerProperties(this, {
				listener: {
					name: 'koa-admin',
					type: 'koa'
				}
			}, this.owner, true).then(() => {
				if (this.config.ssh) {
					this.sshServer = sshServer(this, this.config.ssh);
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

function registerWithManager(manager) {
	return manager.registerServiceFactory(ServiceAdmin).then(admin =>
		manager.declareService({
			type: admin.name,
			name: admin.name
		}));
}

export {
	ServiceAdmin,
	registerWithManager
};
