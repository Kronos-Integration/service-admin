/*
  koa = require('koa');
  //    route = require('koa-route'),
  //  jwt = require('koa-jwt'),
  //    websockify = require('koa-websocket');

  const app = websockify(koa());

  // secure all the following requests if jwt is present
  if (options.jwt) {
    app.use(jwt({
      secret: options.jwt.secret
    }));
  }

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
