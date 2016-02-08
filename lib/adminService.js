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
		return super._start().then(() => this.owner.loadFlowFromFile(path.join(__dirname, '..', 'admin.flow')));
	}
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

module.exports.registerWithManager = manager =>
	manager.registerServiceFactory(ServiceAdmin).then(admin =>
		manager.declareService({
			'type': admin.name,
			'name': admin.name
		}));
