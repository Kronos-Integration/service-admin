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
					this.sshServer = new ssh2.Server(this.config.ssh, client => {
						client.on('authentication', ctx => {
							console.log('authentication');
							ctx.accept();
						});

						client.on('ready', ctx => {
							client.on('session', (accept, reject) => {
								const session = accept();
								session.once('exec', function (accept, reject, info) {
									console.log('Client wants to execute: ' + info.command);
									const stream = accept();
									stream.stderr.write('Oh no, the dreaded errors!\n');
									stream.write('Just kidding about the errors!\n');
									stream.exit(0);
									stream.end();
								});
							});
						});
					});

					this.sshServer.listen(0, '127.0.0.1', function () {
						console.log('Listening on port ' + this.address().port);
					});
				}

				return this.owner.loadFlowFromFile(path.join(__dirname, '..', 'admin.flow'));
			});
		});
	}

	_stop() {
		if (this.sshServer) {
			this.sshServer.close();
			delete this.sshServer;
		}
		this.owner.removeListener('stepStateChanged', this._stepStateChangedListener);
		return super._stop();
	}
}

module.exports.registerWithManager = manager =>
	manager.registerServiceFactory(ServiceAdmin).then(admin =>
		manager.declareService({
			'type': admin.name,
			'name': admin.name
		}));
