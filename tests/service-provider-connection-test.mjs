import test from "ava";

import { Interceptor } from "@kronos-integration/interceptor";

import {
  TestService,
  TestServiceWithoutAdditionalEndpoints,
  makeServices
} from "./helpers/util.mjs";

test("declare services", async t => {
  const sp = await makeServices();

  const {s2, s3, s4} = await sp.declareServices(
    {
      s3: {
        type: TestService,
        key3: 2,
        endpoints: {
          testIn: { receive: "testReceive" },
          testOut: {
            interceptors: [Interceptor],
            connected: "service(s2).testIn"
          }
        }
      },
      s2: {
        type: TestService,
        endpoints: {
          testOut: "service(s3).testIn"
        }
      },
      s4: {
        type: TestServiceWithoutAdditionalEndpoints
      }
    },
    true
  );

  t.is(s2.name, "s2");
  t.is(s3.name, "s3");
  t.is(s4.name, "s4");

  t.is(s2.type, "test");
  t.is(s3.type, "test");
  t.is(s4.type, "test-without-additional-endpoints");

  t.is(s3.key3, 2);

  t.true(s2.endpoints.testOut.hasConnections);
//  console.log(s2.endpoints.testOut.toString());
  t.true(s2.endpoints.testOut.isConnected(s3.endpoints.testIn));

  t.true(s3.endpoints.testOut.hasConnections);
  t.true(s3.endpoints.testOut.isConnected(s2.endpoints.testIn));
});
