import test from "ava";
import { TestService } from "./helpers/util.mjs";

import { StandaloneServiceProvider, InitializationContext } from "@kronos-integration/service";

function icet(t, sp, expression, ep, result) {
  const ic = new InitializationContext(sp);
  t.is(ic.endpointForExpression(expression, ep), result);
}

icet.title = (providedTitle = "", sp, expression, ep, result) =>
  `service ${providedTitle} ${expression} (${ep.name})`.trim();

const sp = new StandaloneServiceProvider();

test(icet, sp, "self", sp.endpoints.log, sp.endpoints.log);
test(icet, sp, "log", sp.endpoints.log, sp.endpoints.log);
test(icet, sp, "log", sp.endpoints.config, sp.endpoints.log);


class NoneWaitingInitializationContext extends InitializationContext {
  get waitForFactories()
  {
    return false;
  }
}

test("service factory", async t => {
  const sp = new StandaloneServiceProvider();
  const ic = new NoneWaitingInitializationContext(sp);

  t.is(await ic.getServiceFactory("test"), undefined);
  t.is(await ic.getServiceFactory(TestService), TestService);
});
