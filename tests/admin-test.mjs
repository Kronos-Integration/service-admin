import test from "ava";
import {
  StandaloneServiceProvider,
  Service
} from "@kronos-integration/service";
import { ServiceAdmin } from "@kronos-integration/service-admin";

const config = {
  name: "admin",
  type: ServiceAdmin
};

test("service-admin service entpoint", async t => {
  const sp = new StandaloneServiceProvider();
  const admin = await sp.declareService(config);
  await admin.start();

  t.is(admin.state, "running");

  let response = await admin.endpoints.services.receive();

  response = JSON.parse(JSON.stringify(response));

  //t.log(response);

  t.deepEqual(response, {
    admin: {
      description: "This service is the base class for service implementations",
      endpoints: {
        command: { in: true, open: true },
        config: { in: true, open: true },
        log: { out: true, open: true, connected: "service(logger).log" },
        services: { out: true, open: true, in: true }
      },
      logLevel: "info",
      name: "admin",
      state: "running",
      timeout: {
        restart: 20,
        start: 20,
        stop: 20
      },
      type: "admin"
    },
    config: {
      description: "Config providing service",
      endpoints: {
        command: { in: true, open: true },
        config: { in: true, open: true },
        log: { out: true, open: true, connected: "service(logger).log" }
      },
      logLevel: "info",
      name: "config",
      state: "running",
      timeout: {
        restart: 20,
        start: 20,
        stop: 20
      },
      type: "config"
    },
    logger: {
      description: "Log consuming service",
      endpoints: {
        command: { in: true, open: true },
        config: { in: true, open: true },
        log: {
          in: true,
          out: true,
          open: true,
          connected: [
            "service(admin).log",
            "service(config).log",
            "service(logger).log",
            "service(standalone-provider).log"
          ]
        }
      },
      logLevel: "info",
      name: "logger",
      state: "stopped",
      timeout: {
        restart: 20,
        start: 20,
        stop: 20
      },
      type: "logger"
    },
    "standalone-provider": {
      description: "This service to control services",
      endpoints: {
        command: { in: true, open: true },
        config: { in: true, open: true },
        log: { out: true, open: true, connected: "service(logger).log" }
      },
      logLevel: "info",
      name: "standalone-provider",
      state: "stopped",
      timeout: {
        restart: 20,
        start: 20,
        stop: 20
      },
      type: "standalone-provider"
    }
  });
});

test("service-admin push from services endpoint", async t => {
  const sp = new StandaloneServiceProvider();
  await sp.declareServices({
    admin: {
      type: ServiceAdmin
    },
    test: {
      type: Service,
      endpoints: {
        test: "service(admin).services"
      }
    }
  });

  const admin = sp.services.admin;
  const ts = sp.services.test;

  const updates = [];
  ts.endpoints.test.receive = update => {
    update = JSON.parse(JSON.stringify(update));

    updates.push(update);
  };

  t.is(ts.name, "test");

  await admin.start();
  t.is(admin.state, "running");

  await ts.start();

  t.is(updates.length, 4);

  t.is(updates[2].test.state, "stopped");
  t.is(updates[3].test.state, "starting");
  //console.log(updates);
});
