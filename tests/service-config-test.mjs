import test from "ava";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceProvider } from "./helpers/util.mjs";

test("service provider without initial config", async t => {
  const sp = new ServiceProvider();

  await sp.start();

  t.is(sp.services.config.name, "config");
});

test("service provider config service", async t => {
  const sp = new ServiceProvider([
    {
      name: "a" // provider itself
    },
    {
      name: "test",
      key3: 3
    }
  ]);

  await sp.start();

  t.is(sp.services.config.name, "config");
  t.is(sp.services.config.state, "running");

  const sc = sp.services.config;

  t.deepEqual(await sc.configFor("service1"), {
    key1: 1
  });

  t.deepEqual(await sc.configFor("test"), {
    key3: 3
  });

  t.deepEqual([...sp.services.config.preservedConfigs.keys()].sort(), [
    "service1",
    "test"
  ]);

  t.deepEqual(sc.preservedConfigs.get("service1"), { key1: 1 });
  t.deepEqual(sc.preservedConfigs.get("test"), { key3: 3 });

  t.is(sp.services.logger.name, "logger");
  t.is(sp.services.logger.state, "running");

  t.is(sp.state, "running");

  t.is(sp.services.a.name, "a");
});

test("configureValue", async t => {
  const sp = new StandaloneServiceProvider();
  const sc = sp.services.config;
  await sc.configureValue("s1.listener", { fd: 4 });
  t.deepEqual(await sc.configFor("s1"), { listener: { fd: 4 } });
});

test("configureValue last wins", async t => {
  const sp = new StandaloneServiceProvider();
  const sc = sp.services.config;

  await sc.configure({ s1: { listener: "/run/socket" } });
  await sc.configureValue("s1.listener", { fd: 4 });
  t.deepEqual(await sc.configFor("s1"), { listener: { fd: 4 } });
});

test("configFor & configureValue", async t => {
  const sp = new StandaloneServiceProvider();
  const sc = sp.services.config;

  t.is(await sc.configFor("not-present"), undefined);

  await sc.configure({
    s1: {
      key1: "value1",
      a: { b: { c: 7 } }
    }
  });

  await sc.configure({
    s1: {
      key2: "value2",
      a: { key3: 3 }
    }
  });

  await sc.configureValue("s1.a.b.c2", { key4: "value4" });

  t.deepEqual(await sc.configFor("s1"), {
    a: { b: { c: 7, c2: { key4: "value4" } }, key3: 3 },
    key1: "value1",
    key2: "value2"
  });

  sc.clearPreserved("s1");

  t.is(await sc.configFor("s1"), undefined);
});
