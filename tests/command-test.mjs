import test from "ava";
import {
  StandaloneServiceProvider,
  Service
} from "@kronos-integration/service";
import { ServiceAdmin } from "@kronos-integration/service-admin";
import { LimitingInterceptor } from "@kronos-integration/interceptor";

const config = {
  name: "admin",
  type: ServiceAdmin
};

test("exec command", async t => {
  const sp = new StandaloneServiceProvider();
  sp.registerInterceptorFactory(LimitingInterceptor);

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
    interceptors: [{type:"request-limit"}]
  });

  t.is(sp.services.test.endpoints.test.interceptors.length,1);
});
