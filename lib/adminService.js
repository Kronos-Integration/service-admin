/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

function delayedFlowLoader(manager, file) {
	return new Promise(function (fullfill, reject) {
		setTimeout(() => {
			fullfill(manager.loadFlowFromFile(file));
		}, 100);
	});
}

module.exports.registerWithManager = function (manager) {
	const koaService = manager.serviceGet('koa-service');

	const adminService = manager.serviceDeclare('koa-service', {
		name: 'admin',
		autostart: true,
		_start() {
			return koaService.start().then(service => {
				return delayedFlowLoader(manager, path.join(__dirname, '..', 'admin.flow')).then(
					f => Promise.resolve(service)
				);
			});
		}
	});

	adminService.koa.use(route.get('/health', ctx => {
		ctx.body = "OK";
	}));
};


/*
const sc = require('./controllers/state').initialize(manager);
app.use(route.get('/state', sc.list));
app.ws.use(route.all('/state', sc.ws));

const fc = require('./controllers/flow').initialize(manager);
app.use(route.get('/flows', fc.list));
app.use(route.get('/flows/:id', fc.fetch));
app.use(route.delete('/flows/:id', fc.delete));
app.use(route.post('/flows', fc.insert));
app.use(route.post('/flows/:id/start', fc.start));
app.use(route.post('/flows/:id/stop', fc.stop));
app.ws.use(route.all('/flows', fc.ws)); * /
*/
