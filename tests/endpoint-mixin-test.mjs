import test from "ava";
import { TestLogger } from "./helpers/util.mjs";

import { SendEndpoint, ReceiveEndpoint } from "@kronos-integration/endpoint";
import {
  Service,
  ServiceProviderMixin,
  InitializationContext
} from "@kronos-integration/service";

class Owner extends ServiceProviderMixin(Service, TestLogger) {
  get name() {
    return "owner";
  }

  get myProperty() {
    return 77;
  }

  async myMethod() {
    return 78;
  }
}

test("outEndpoints", t => {
  const o = new Owner();

  t.truthy(o.endpoints.log.send);

  t.deepEqual(o.outEndpoints, [o.endpoints.log]);
});

test("inEndpoints", t => {
  const o = new Owner();
  t.deepEqual(
    o.inEndpoints.map(e => e.name),
    ["config", "command"]
  );
});

test("endpointForExpression simple", t => {
  const o = new Owner();
  const s1 = new SendEndpoint("s1");
  const r1 = new ReceiveEndpoint("r1");

  o.addEndpoint(s1);
  o.addEndpoint(r1);

  t.deepEqual(o.endpointForExpression("r1"), r1);
  t.deepEqual(o.endpointForExpression("s1"), s1);
});

test("endpointForExpression service", t => {
  const o = new Owner();

  t.is(o.endpointForExpression("service(config).command").name, "command");
  t.is(o.endpointForExpression("service(logger).log").name, "log");
});

test("endpointForExpression service undefined", t => {
  const o = new Owner();
  t.is(o.endpointForExpression("service(something).something"), undefined);
});

test("endpointForExpression undefined", t => {
  const o = new Owner();
  const r1 = new ReceiveEndpoint("r1");

  o.addEndpoint(r1);

  t.is(o.endpointForExpression("r2"), undefined);
});

test("endpointFromConfig simple connected", t => {
  const o = new Owner();
  const ic = new InitializationContext(o);

  const r1 = new ReceiveEndpoint("r1");
  o.addEndpoint(r1);

  const e = o.createEndpointFromConfig("e", { connected: "r1" }, ic);

  t.is(e.name, "e");
  t.true(e.isConnected(r1));
});

test("endpointFromConfig multiple connected", t => {
  const o = new Owner();
  const ic = new InitializationContext(o);

  const r1 = new ReceiveEndpoint("r1");
  o.addEndpoint(r1);
  const r2 = new ReceiveEndpoint("r2");
  o.addEndpoint(r2);

  const e = o.createEndpointFromConfig("e", { connected: ["r1","r2"] }, ic);

  t.is(e.name, "e");
  t.true(e.isConnected(r1));
  t.true(e.isConnected(r2));
});

test("endpointFromConfig request multi", t => {
  const o = new Owner();
  const ic = new InitializationContext(o);

  const r1 = new ReceiveEndpoint("r1");
  o.addEndpoint(r1);
  const r2 = new ReceiveEndpoint("r2");
  o.addEndpoint(r2);

  // request multi
  const e = o.createEndpointFromConfig("e", { multi: true }, ic);

  t.is(e.name, "e");
  
  // connect later
  e.addConnection(r1);
  e.addConnection(r2);
  
  t.true(e.isConnected(r1));
  t.true(e.isConnected(r2));
});

test("endpointFromConfig foreign connected", t => {
  const o = new Owner();
  const ic = new InitializationContext(o);

  const e = o.createEndpointFromConfig(
    "e",
    { connected: "service(logger).log" },
    ic
  );

  t.is(e.name, "e");
  t.true(e.isConnected(o.services.logger.endpoints.log));
});

test("endpointFromConfig foreign connected expression only", t => {
  const o = new Owner();
  const ic = new InitializationContext(o);

  const e = o.createEndpointFromConfig("e", "service(logger).log", ic);

  t.true(e.isConnected(o.services.logger.endpoints.log));

  t.is(e.name, "e");
  t.true(e.isConnected(o.services.logger.endpoints.log));
});

test("endpointFromConfig real connected", t => {
  const dummyLogReceiver = new ReceiveEndpoint("log", {});

  dummyLogReceiver.receive = entry => {
    console.log(safeStringify(entry));
  };

  const o = new Owner();
  const ic = new InitializationContext(o);

  const e = o.createEndpointFromConfig(
    "e",
    { connected: dummyLogReceiver },
    ic
  );

  t.is(e.name, "e");
  t.true(e.isConnected(dummyLogReceiver));
});

test("endpointFromConfig receive property", async t => {
  const o = new Owner();
  const ic = new InitializationContext(o);

  const e = o.createEndpointFromConfig("e", { receive: "myProperty" }, ic);

  t.is(await e.receive(), 77);
});

test("endpointFromConfig receive method", async t => {
  const o = new Owner();
  const ic = new InitializationContext(o);
  const e = o.createEndpointFromConfig("e", { receive: "myMethod" }, ic);

  t.is(await e.receive(), 78);
});
