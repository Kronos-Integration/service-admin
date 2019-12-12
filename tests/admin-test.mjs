import test from "ava";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceAdmin } from "../src/service-admin.mjs";

const config = {
  admin: {
    type: ServiceAdmin
  }
};

test("service-admin", async t => {
  const sp = new StandaloneServiceProvider();
  const [admin] = await sp.declareServices(config);
  await admin.start();

  t.is(admin.state, "running");

  let response = await admin.endpoints.services.receive(undefined);

  response = JSON.parse(JSON.stringify(response));

  t.log(response);

  t.deepEqual(response, {
    'standalone-provider': {
      name: "standalone-provider",
      type: "standalone-provider"
    },
    admin: { name: "admin", type: "admin" },
    config: { name: "config", type: "config" },
    logger: { name: "logger", type: "logger" }
  });
});
