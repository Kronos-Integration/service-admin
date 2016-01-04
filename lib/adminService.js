/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

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

module.exports.registerWithManager = function (manager) {
	const koaService = manager.serviceGet('koa');

	const adminService = manager.serviceDeclare('koa', {
		name: 'admin',
		autostart: true,
		_start() {
			return koaService.start().then(service => {
				return delayedFlowLoader(manager, path.join(__dirname, '..', 'admin.flow')).then(
					f => {
						return Promise.resolve(service);
					}
				).catch(e => {
					console.log(e);
				});
			});
		}
	});

	adminService.koa.use(route.get('/health', ctx => {
		ctx.body = "OK";
	}));
};


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
