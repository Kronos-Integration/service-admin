import test from "ava";
import { TestService } from "./helpers/util.mjs";

import {
  Service,
  ServiceProviderMixin,
  defineServiceConsumerProperties
} from "@kronos-integration/service";

class ServiceProvider extends ServiceProviderMixin(Service) {}

test("service consumer define with name and type", async t => {
  const sp = new ServiceProvider({});
  const object = {};

  await sp.registerServiceFactory(TestService);

  await defineServiceConsumerProperties(
    object,
    {
      myTest: {
        type: "test",
        name: "n1"
      }
    },
    sp
  );
  t.is(object.myTest.name, "n1");
});

test("service consumer define with type", async t => {
  const sp = new ServiceProvider({});
  const object = {};

  await sp.registerServiceFactory(TestService);

  await defineServiceConsumerProperties(
    object,
    {
      myTest2: {
        type: "test"
      }
    },
    sp
  );

  t.is(object.myTest2.name, "myTest2");
});

test("service consumer define with type simple", async t => {
  const sp = new ServiceProvider({});
  const object = {};

  await sp.registerServiceFactory(TestService);

  await defineServiceConsumerProperties(
    object,
    {
      myTest3: "test"
    },
    sp
  );

  t.is(object.myTest3.name, "myTest3");
});

test("service consumer with wait", async t => {
  const sp = new ServiceProvider({});
  const object = {};

  setTimeout(() => sp.registerServiceFactory(TestService), 300);

  await defineServiceConsumerProperties(
    object,
    {
      myTest: {
        type: "test"
      }
    },
    sp,
    true
  );

  t.is(object.myTest.name, "myTest");
});
