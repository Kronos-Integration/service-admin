import Service from "./service.mjs";
import { keyValue2Object } from "./util.mjs";

/**
 * Config providing service.
 * Dispatches config requests to services.
 * or preserves them until a maching service becomes avaliable
 * @property {Map<string,Object>} preservedConfigs values for services not alredy established
 */
export default class ServiceConfig extends Service {
  /**
   * @return {string} 'config'
   */
  static get name() {
    return "config";
  }

  static get description() {
    return "Config providing service";
  }

  constructor(config, ic) {
    super(config, ic);

    this.preservedConfigs = new Map();
  }

  /**
   * Deliver configuration for a given service.
   * @param {string} name service name
   * @param {object} config
   */
  async configFor(name, config) {
    this.trace(`configFor ${name}`);

    await this.start();

    const pc = this.preservedConfigs.get(name);
    if (pc !== undefined) {
      config = config === undefined ? pc : merge(config, pc);
      this.trace(`using preserved config ${name}`);
    }

    this.preservedConfigs.set(name, config);

    return config;
  }

  /**
   * Forget about preserved config of a service.
   * @param {string} name service name
   */
  clearPreserved(name) {
    this.preservedConfigs.delete(name);
  }

  /**
   * Set config entry.
   * @param {string} key path to the value
   * @param {any} value
   */
  async configureValue(key, value) {
    return this.configure(keyValue2Object(key, value));
  }

  /**
   *
   * @param {Array|Object} config
   */
  async configure(config) {
    if (config === undefined) {
      return;
    }

    const update = async (name, c) => {
      const s = this.owner.services[name];
      if (s === undefined) {
        delete c.name;

        const merged = merge(this.preservedConfigs.get(name), c);
        this.trace(`preserve config for ${name} ${JSON.stringify(merged)}`);
        this.preservedConfigs.set(name, merged);
      } else {
        return s.configure(c);
      }
    };

    await Promise.all(
      Array.isArray(config)
        ? config.map(c => update(c.name, c))
        : Object.entries(config).map(([k, v]) => update(k, v))
    );
  }

  /**
   * We always start immediate.
   * @return {boolean} true
   */
  get autostart() {
    return true;
  }

  get name() {
    return "config";
  }
}

/**
 * Merge from b into a.
 * When *a* and *b* are arrays of values only the none duplicates are appendend to *a*.
 * @param {any} a
 * @param {any} b
 * @return {any} merged b into a
 */
export function merge(a, b) {
  if (b === undefined || b === null) {
    return a;
  }

  if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      return [...a, ...b.filter(x => !a.find(e => equal(e, x)))];
    }
    return [...a, b];
  }

  if (Array.isArray(b)) {
    return b;
  }

  if (b instanceof Buffer) {
    return b;
  }

  switch (typeof b) {
    case "function":
    case "string":
    case "number":
    case "boolean":
      return b;
    case "object":
      if (a === undefined || a === null || typeof a !== "object") {
        a = {};
      }
      Object.keys(b).forEach(k => (a[k] = merge(a[k], b[k])));
  }

  return a;
}

function equal(a, b) {
  return Object.is(a, b);
}
