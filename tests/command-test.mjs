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

test("exec command", async t => {
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

  await admin.endpoints.command.receive({
    action: "insert",
    service: "test",
    endpoint: "test",
    interceptors: [{ type: "live-probe" }]
  });

  t.is(sp.services.test.endpoints.test.interceptors[0].type, "live-probe");

  const ts = sp.services.test;

  ts.endpoints.test.receive = update => {
    console.log("XXX");
  };

  await admin.endpoints.command.receive({
    action: "stop",
    service: "config"
  });


});
