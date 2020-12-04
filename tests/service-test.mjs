import test from "ava";
import { TestService, TestServiceWithoutAdditionalEndpoints } from "./helpers/util.mjs";

import { SendEndpoint } from "@kronos-integration/endpoint";
import { Service, InitializationContext } from "@kronos-integration/service";

const owner = {
  services: {},

  warn(...args) { /*console.log(...args);*/ },
  trace() {},
  error() {},
  getService(name) {
    return this.services[name];
  },
  endpointForExpression(expression) {},
  instantiateInterceptor(def) {},
  serviceStateChanged() {}
};

const ic = new InitializationContext(owner);

owner.services.logger = new Service(
  { endpoints: { log: { receive: entry => console.log(entry) } } },
  ic
);

function st(t, factory, options, expected = {}) {
  expected = {
    timeout: { start: 20 },
    autostart: false,
    endpoints: {
      log: { hasConnections: true },
      ...expected.entpoints
    },
    configuration: {},
    ...expected
  };

  const s1 = new factory(options, ic);

  t.is(s1.owner, owner, "owner");

  t.is(s1.type, factory.name, "name");

  t.is(s1.state, "stopped", "state");
  t.is(s1.autostart, expected.autostart, "autostart");
  t.is(s1.logLevel, "info", "logLevel");
  t.is(s1.timeout.start, expected.timeout.start);

  for (const [name, e] of Object.entries(expected.endpoints)) {
    t.truthy(s1.endpoints[name], `${name} endpoint`);
    t.is(s1.endpoints[name].name, name, `${name} endpoint`);
    if (e.hasConnections !== undefined) {
      t.is(
        s1.endpoints[name].hasConnections,
        e.hasConnections,
        `${name} endpoint connected`
      );
    }
  }

  for (const [name, c] of Object.entries(expected.configuration)) {
    t.truthy(s1.configurationAttributes[name], `${name} configuration`);
    t.is(s1.configurationAttributes[name].name, name);
    if (c.value !== undefined) {
      t.is(s1[name], c.value, `${name} value`);
    }
  }

  if (expected.description !== undefined) {
    t.is(s1.description, expected.description, "service description");
  }

  if (options && options.name !== undefined) {
    t.is(s1.name, options.name, "service name");
  }

  if (expected.json !== undefined) {
    t.deepEqual(s1.toJSONWithOptions({
      includeRuntimeInfo: false,
      includeDefaults: false,
      includeName: true,
      includeConfig: false
    }), expected.json);
  }

  t.is(s1.toString(), `${s1.name}(state=stopped)`);
}

st.title = (providedTitle = "", factory, options) =>
  `service ${providedTitle} ${factory.name} ${JSON.stringify(options)}`.trim();

test(
  st,
  Service,
  { name: "service", key1: "value1", key2: 2 },
  {
    key1: "value1",
    key2: 2
  }
);

test(
  "given name",
  st,
  Service,
  { name: "myName", description: "my description", autostart: true },
  {
    description: "my description",
    autostart: true,
    json: {
      name: "myName",
      type: "service"
    }
  }
);

test(
  "with endpoints",
  st,
  Service,
  {
    name: "service",
    endpoints: {
      ep1: { in: true, interceptors: ["rate-limit"] }
    }
  },
  {
    endpoints: { ep1: { isConnected: false } },
    json: {
      name: "service",
      type: "service",
      endpoints: {
        ep1: { in: true }
      }
    }
  }
);

test(
  st,
  TestService,
  { name: "service", description: "my description", key3: "value3", key4: 4 },
  {
    description: "my description",
    autostart: true,
    endpoints: { testIn: { isConnected: false } },
    configuration: {
      key3: {},
      key4: { value: 4 }
    }
  }
);

test(st, TestServiceWithoutAdditionalEndpoints);

test("service create with logLevel", t => {
  const s1 = new Service(
    {
      key1: "value1",
      logLevel: "trace"
    },
    ic
  );
  t.is(s1.logLevel, "trace");

  s1.error("some error");
  s1.error({
    key1: "value1"
  });

  const s2 = new Service(
    {
      key1: "value1",
      logLevel: "na sowas"
    },
    ic
  );

  t.is(s2.logLevel, "info");
});

test("service create with DEBUG=1", t => {
  process.env.DEBUG = 1;

  const s1 = new Service(
    {
      key1: "value1"
    },
    ic
  );

  t.is(s1.logLevel, "debug");

  const s2 = new Service(
    {
      key1: "value1",
      logLevel: "warn"
    },
    ic
  );

  t.is(s2.logLevel, "debug");

  delete process.env.DEBUG;
});

test("service create with LOGLEVEL=trace", t => {
  process.env.LOGLEVEL = "trace";

  const s1 = new Service(
    {
      key1: "value1"
    },
    ic
  );

  t.is(s1.logLevel, "trace");

  delete process.env.LOGLEVEL;
});

test("service derived configuration", async t => {
  const s1 = new TestService(
    {
      key7: 1,
      key3: "secret"
    },
    ic
  );

  const se = new SendEndpoint("se", {
    get name() {
      return "a";
    }
  });
  se.addConnection(s1.endpoints.config);

  await se.send({
    logLevel: "trace",
    key2: 77
  });

  t.is(s1.logLevel, "trace");
  t.is(s1.key2, 77);

  t.is(s1.endpoints.testIn.name, "testIn");
});

test("service derived configuration change start timeout", async t => {
  const s1 = new TestService(
    {
      key7: 1
    },
    ic
  );

  await s1.configure({
    timeout: {
      start: 123.45
    }
  });

  t.is(s1.timeout.start, 123.45);
});

test("service states", async t => {
  const s1 = new TestService(
    {
      key1: "value1",
      key2: 2
    },
    ic
  );

  await s1.restartIfRunning();
  t.is(s1.state, "stopped");

  await s1.start();
  t.is(s1.state, "running");

  await s1.restartIfRunning();
  t.is(s1.state, "running");
  await s1.restart();
  t.is(s1.state, "running");

  const s2 = new TestService(
    {
      key1: "value1",
      key2: 2
    },
    ic
  );

  t.is(s2.state, "stopped");

  await s1.stop();
  t.is(s1.state, "stopped");
});
