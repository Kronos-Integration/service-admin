import test from "ava";
import {
  Service,
  StandaloneServiceProvider,
  InitializationContext
} from "@kronos-integration/service";

import { data } from "./fixtures/data.mjs";

class MyInitializationContext extends InitializationContext {
  async getServiceFactory(type) {
    const f = await super.getServiceFactory(type);

    if (!f) {
      return Service;
    }
  }

  get waitForFactories() {
    return false;
  }

  connectEndpoint(endpoint, connected) {
    try {
      super.connectEndpoint(endpoint, connected);
    } catch (e) {}
  }
}

test("service provider declare services", async t => {
  const sp = new StandaloneServiceProvider({}, new MyInitializationContext());

  await sp.declareServices(data);

  t.is(Object.values(sp.services).length, 11);

  t.is(sp.services.logger.name, "logger");
  t.is(sp.services.logger.type, "logger");
  t.is(sp.services.logger.logLevel, "debug");
  t.is(sp.services.logger.state, "stopped");

  t.is(sp.services.logger.endpoints.log.name, "log");
  t.is(sp.services.logger.endpoints.log.isIn, true);
  t.is(sp.services.logger.endpoints.log.isOut, true);
  t.is(sp.services.logger.endpoints.log.isOpen, true);
  t.is(sp.services.logger.endpoints.log.hasConnections, true);

  t.is(sp.services.logger.endpoints.config.name, "config");
  t.is(sp.services.logger.endpoints.config.isIn, true);
  t.is(sp.services.logger.endpoints.config.isOut, false);
  t.is(sp.services.logger.endpoints.config.isOpen, true);
  t.is(sp.services.logger.endpoints.config.hasConnections, false);
});
