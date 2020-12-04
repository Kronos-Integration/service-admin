import test from "ava";
import { keyValue2Object } from "../src/util.mjs";

function kvot(t, k, v, e) {
  t.deepEqual(keyValue2Object(k, v), e);
}

kvot.title = (providedTitle = "", k, v, o) =>
  `service ${providedTitle} ${k} ${v}`.trim();

test(kvot, "a.b", 1, { a: { b: 1 } });
test(kvot, "a", 1, { a: 1 });
