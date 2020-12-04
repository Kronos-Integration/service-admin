import test from "ava";
import { TestService } from "./helpers/util.mjs";
import { StandaloneServiceProvider } from "@kronos-integration/service";

test("declareService", async t => {
  const ssm = new StandaloneServiceProvider();
  ssm.registerServiceFactory(TestService);

  const s = await Promise.all(
    ["s1", "s2", "s3", "s4", "s5"].map(name =>
      ssm.declareService(
        {
          name,
          type: "test"
        },
        true
      )
    )
  );

  // console.log(s.map(s => s.name));

  t.is(ssm.services.s1.name, "s1");
  //  t.is(ssm.services.s3.name, "s3");
});

test("declareService delayed", async t => {
  const ssm = new StandaloneServiceProvider();

  const declarations = Promise.all(
    ["s1", "s2", "s3", "s4", "s5"].map(name =>
      ssm.declareService(
        {
          name,
          type: "test"
        },
        true
      )
    )
  );

  await ssm.registerServiceFactory(TestService);

  await declarations;
  t.is(ssm.services.s1.name, "s1");
  // t.is(ssm.services.s3.name, "s3");
});

test("configure", async t => {
  const ssm = new StandaloneServiceProvider();
  ssm.registerServiceFactory(TestService);

  const s1 = await ssm.declareService(
    {
      name: "s1",
      type: "test"
    },
    true
  );

  t.is(s1.type, "test");

  await ssm.services.config.configure({
    s1: {
      value: "for s1"
    }
  });

  t.is(s1.value, "for s1");
});
