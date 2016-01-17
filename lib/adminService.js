/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	route = require('koa-route'),
	ServiceKOA = require('kronos-service-koa').ServiceKOA;

/**
 * collects health state form all components
 */
class ServiceAdmin extends ServiceKOA {
	static get type() {
		return "admin";
	}

	get type() {
		return AdminService.type;
	}

	constructor(config) {
		super(config);
	}

	get autostart() {
		return true;
	}

	_start() {
		return super._start().then(() => {
			return delayedFlowLoader(manager, path.join(__dirname, '..', 'admin.flow')).then(
				f => Promise.resolve()
			).catch(e => {
				console.log(e);
			});
		});
	}
}

module.exports.registerWithManager = manager => {
	manager.registerService(ServiceAdmin);
};

function delayedFlowLoader(manager, file) {
	return new Promise(function (fullfill, reject) {
		setTimeout(() => {
			const flow = manager.loadFlowFromFile(file);
			flow.then(f => {
				console.log(`load: ${f}`);
			}).catch(e => {
				console.log(`load error: ${e}`);
			});
			fullfill(flow);
		}, 10);
	});
}

/*
app.use(route.get('/state', sc.list));
app.ws.use(route.all('/state', sc.ws));

app.use(route.get('/flows', fc.list));
app.use(route.get('/flows/:id', fc.fetch));
app.use(route.delete('/flows/:id', fc.delete));
app.use(route.post('/flows', fc.insert));
app.use(route.post('/flows/:id/start', fc.start));
app.use(route.post('/flows/:id/stop', fc.stop));
app.ws.use(route.all('/flows', fc.ws)); * /
*/
