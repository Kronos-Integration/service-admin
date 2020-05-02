import test from "ava";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceAdmin } from "@kronos-integration/service-admin";

const config = {
  name: "admin",
  type: ServiceAdmin
};

test("service-admin", async t => {
  const sp = new StandaloneServiceProvider();
  const admin = await sp.declareService(config);
  await admin.start();

  t.is(admin.state, "running");

  let response = await admin.endpoints.services.receive();

  response = JSON.parse(JSON.stringify(response));

  t.log(response);

  t.deepEqual(response, {
    admin: {
      endpoints: {
        command: { in: true, open: true },
        config: { in: true, open: true },
        log: { out: true, open: true, connected: "service(logger).log" },
        services: { out: true, in: true }
      },
      logLevel: "info",
      name: "admin",
      state: "running",
      type: "admin"
    },
    config: {
      endpoints: {
        command: { in: true, open: true },
        config: { in: true, open: true },
        log: { out: true, open: true, connected: "service(logger).log" }
      },
      logLevel: "info",
      name: "config",
      state: "running",
      type: "config"
    },
    logger: {
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
      type: "logger"
    },
    "standalone-provider": {
      endpoints: {
        command: { in: true, open: true },
        config: { in: true, open: true },
        log: { out: true, open: true, connected: "service(logger).log" }
      },
      logLevel: "info",
      name: "standalone-provider",
      state: "stopped",
      type: "standalone-provider"
    }
  });
});
