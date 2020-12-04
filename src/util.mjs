export function keyValue2Object(key, value) {
  const path = key.split(/\./);

  const config = {};

  let c = config;

  do {
    let slot = path.shift();
    if (path.length === 0) {
      c[slot] = value;
      break;
    }

    if (c[slot] === undefined) {
      c[slot] = {};
    }

    c = c[slot];
  } while (true);

  return config;
}
