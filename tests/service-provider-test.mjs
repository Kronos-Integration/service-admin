import test from "ava";

import { ServiceProvider, TestService, makeServices } from "./helpers/util.mjs";
import { InitializationContext } from "@kronos-integration/service";

test("service provider additional service", async t => {
  const sp = new ServiceProvider();
  const ic = new InitializationContext(sp);
  await sp.start();
  await sp.registerService(new TestService({ name: "test1" }, ic));

  // await sp.registerService(new TestService({ name: "test2" }, ic));

  //console.log(JSON.stringify(sp.services, undefined, 2));

  t.is(sp.services.test1.name, "test1");

  t.deepEqual(sp.services.test1.endpoints.log.toJSON(), {
    connected: "service(logger).log",
    out: true,
    open: true
  });

  sp.services.test1.info("hello");

  t.true(
    sp.services.test1.endpoints.log.isConnected(
      sp.services.logger.endpoints.log
    )
  );
});

test("service provider additional service configure service", async t => {
  const sp = new ServiceProvider();
  const ic = new InitializationContext(sp);
  await sp.start();
  await sp.registerService(
    new TestService(
      {
        name: "test1",
        endpoints: { testOut: { connected: "service(logger).log" } }
      },
      ic
    )
  );

  await sp.services.test1.configure({
    key: "new value"
  });

  t.is(sp.services.test1.key, "new value");
});

test("service provider additional service send change request over config service", async t => {
  const sp = new ServiceProvider();
  const ic = new InitializationContext(sp);
  await sp.registerService(
    new TestService(
      { name: "t2", endpoints: { testOut: { connected: "service(log).log" } } },
      ic
    )
  );

  await sp.start();

  await sp.services.config.endpoints.config.receive([
    {
      name: "config"
    },
    {
      name: "unknown"
    },
    {
      name: "t2",
      key1: 4711,
      key2: "2"
    }
  ]);

  t.is(sp.services.t2.key1, 4711);
});

test("service provider logging", async t => {
  const logLevel = "trace";

  const sp = new ServiceProvider({ logLevel });

  t.true(sp.endpoints.log.isConnected(sp.services.logger.endpoints.log));
  t.true(
    sp.services.config.endpoints.log.isConnected(
      sp.services.logger.endpoints.log
    )
  );
  t.true(
    sp.services.logger.endpoints.log.isConnected(
      sp.services.logger.endpoints.log
    )
  );

  const ic = new InitializationContext(sp);

  await sp.registerService(
    new TestService(
      {
        name: "t2",
        endpoints: { testOut: { connected: "service(logger).log" } }
      },
      ic
    )
  );

  ic.resolveOutstandingEndpointConnections();

  t.is(sp.services.t2.endpoints.testOut.name, "testOut");

  t.true(
    sp.services.t2.endpoints.testOut.isConnected(
      sp.services.logger.endpoints.log
    )
  );

  await sp.services.config.endpoints.config.receive([
    {
      name: "config"
    },
    {
      name: "unknown"
    },
    {
      name: "t2",
      key1: 4711,
      key2: "2"
    }
  ]);

  //console.log(sp.services.logger.logEntries);
  //t.is(sp.services.logger.logEntries.length, 7);
});

test("service provider additional service can be unregistered", async t => {
  const sp = await makeServices();

  await sp.unregisterService("t2");

  t.is(sp.services.t2, undefined);
});

test("declare service with factory class", async t => {
  const sp = await makeServices();

  const s2a = await sp.declareService({
    name: "s2",
    type: TestService,
    endpoints: { testOut: { connected: "service(logger).log" } },
    key3: 77
  });
  t.is(s2a.name, "s2");
  t.is(s2a.type, "test");
  t.is(s2a.key3, 77);
});

test("service provider additional service declare service with type", async t => {
  const sp = await makeServices();

  setTimeout(() => sp.registerServiceFactory(TestService), 30);

  const s2a = await sp.declareService(
    {
      name: "s2",
      type: "test",
      endpoints: { testOut: { connected: "service(logger).log" } }
    },
    true
  );

  t.is(s2a.name, "s2");

  const s2b = await sp.declareService(
    {
      name: "s2",
      type: "test",
      endpoints: { testOut: { connected: "service(logger).log" } }
    },
    true
  );

  t.is(s2b.name, "s2");

  const s2c = await sp.declareService(
    {
      name: "s2",
      type: "test",
      endpoints: { testOut: { connected: "service(logger).log" } },
      key: 1
    },
    true
  );

  t.is(s2c.name, "s2");
  t.is(s2c.type, "test");
  t.is(s2c.key, 1);

  const s2d = await sp.declareService(
    {
      name: "s2",
      type: "test",
      endpoints: { testOut: { connected: "service(logger).log" } },
      key: 2
    },
    true
  );

  t.is(s2d.name, "s2");
  t.is(s2d.type, "test");
  t.is(s2d.key, 2);
});
