/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	ServiceKOA = require('kronos-service-koa').Service;

/**
 *
 */
class ServiceAdmin extends ServiceKOA {
	static get name() {
		return "admin";
	}

	get type() {
		return ServiceAdmin.name;
	}

	get autostart() {
		return true;
	}

	_start() {
		this._stepStateChangedListener = (step, oldState, newState) => {
			this.endpoints.io.receive({
				event: 'stepStateChanged',
				data: {
					oldState: oldState,
					newState: newState
				}
			});
		};

		this.owner.addListener('stepStateChanged', this._stepStateChangedListener);

		return super._start().then(() => this.owner.loadFlowFromFile(path.join(__dirname, '..', 'admin.flow')));
	}

	_stop() {
		this.owner.removeListener('stepStateChanged', this._stepStateChangedListener);
		return super._stop();
	}
}

module.exports.registerWithManager = manager =>
	manager.registerServiceFactory(ServiceAdmin).then(admin =>
		manager.declareService({
			'type': admin.name,
			'name': admin.name,
			'io': {}
		}));
