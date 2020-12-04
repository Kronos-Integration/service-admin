import test from "ava";
import { SendEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";


async function makeServiceProvider() {
  const sp = new StandaloneServiceProvider([
    {
      name: "a"
    },
    {
      name: "test",
      key3: 3
    }
  ]);

  const testEndpoint = new SendEndpoint("test");
  testEndpoint.addConnection(sp.endpoints.command);

  await sp.start();

  return { sp, testEndpoint };
}

test("service provider command endpoint", async t => {
  const { testEndpoint } = await makeServiceProvider();

  const response = await testEndpoint.send({
    action: "list",
    options: {
      includeRuntimeInfo: false,
      includeDefaults: false,
      includeName: true,
      includeConfig: false
    }
  });

  t.deepEqual(
    response.sort((a, b) => a.name.localeCompare(b.name)),
    [
      {
        name: "a",
        type: "standalone-provider"
      },
      {
        name: "config",
        type: "config"
      },
      {
        name: "logger",
        type: "logger"
      }
    ]
  );
});

test("service provider command endpoint get", async t => {
  const { testEndpoint } = await makeServiceProvider();

  const response = await testEndpoint.send({
    action: "get",
    service: "logger",
    options: {
      includeRuntimeInfo: true,
      includeDefaults: true,
      includeConfig: true,
      includeName: true
    }
  });

  t.deepEqual(response, {
    description: "Log consuming service",
    endpoints: {
      command: {
        in: true,
        open: true
      },
      config: {
        in: true,
        open: true
      },
      log: {
        connected: [
          "service(a).log",
          "service(config).log",
          "service(logger).log",
          "service(logger).log" // TODO why is there a duplicate
        ],
        in: true,
        out: true,
        open: true
      }
    },
    timeout: {
      start: 20,
      restart: 20,
      stop: 20
    },
    logLevel: "info",
    state: "running",
    name: "logger",
    type: "logger"
  });
});

test("service provider command endpoint start / stop", async t => {
  const { sp, testEndpoint } = await makeServiceProvider();

  let response = await testEndpoint.send({
    action: "start",
    service: "logger"
  });

  t.is(response.state, "running");

  response = await testEndpoint.send({
    action: "stop",
    service: "logger"
  });

  t.is(response.state, "stopped");

  response = await testEndpoint.send({
    action: "restart",
    service: "logger"
  });

  t.is(response.state, "running");
});

test("service provider command endpoint several restarts", async t => {
  const { sp, testEndpoint } = await makeServiceProvider();

  const response = await testEndpoint.send([
    {
      action: "restart",
      service: "logger"
    },
    {
      action: "restart",
      service: "logger"
    }
  ]);

  t.is(response[0].state, "running");
  t.is(response[1].state, "running");
});

test("service provider command endpoint restart unknown service", async t => {
  const { sp, testEndpoint } = await makeServiceProvider();

  try {
    const response = await testEndpoint.send({
      action: "restart",
      service: "invalid"
    });
    t.is(response.state, "running");
  } catch (e) {
    t.is(e.message, "Unknown service: invalid");
  }
});

test("service provider command endpoint restart unknown command", async t => {
  const { sp, testEndpoint } = await makeServiceProvider();

  try {
    const response = await testEndpoint.send({
      action: "unknown",
      service: "logger"
    });
    t.is(response.state, "running");
  } catch (e) {
    t.is(e.message, "Unknown command: unknown");
  }
});
