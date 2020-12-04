import { createAttributes } from "model-attributes";
import {
  Service,
  ServiceLogger,
  ServiceConfig,
  ServiceProviderMixin,
  InitializationContext
} from "@kronos-integration/service";

export async function wait(msecs = 1000) {
  return new Promise(resolve => setTimeout(() => resolve(), msecs));
}

export class TestLogger extends ServiceLogger {
  constructor(...args) {
    super(...args);
    this.logEntries = [];
    this.endpoints.log.receive = entry => this.logEntries.push(entry);
  }

  async _start() {
    return wait(1000);
  }
}

export class TestConfig extends ServiceConfig {
  async _start() {
    wait(1000);

    super.configure({
      service1: {
        key1: 1
      }
    });
  }
}

export class TestServiceWithoutAdditionalEndpoints extends Service {
  static get name() {
    return "test-without-additional-endpoints";
  }

  static get configurationAttributes() {
    return Object.assign(
      createAttributes({
        key3: {
          needsRestart: true
        },
        key4: {}
      }),
      Service.configurationAttributes
    );
  }
}

export class TestService extends Service {
  static get name() {
    return "test";
  }

  static get description() {
    return "my description";
  }

  /**
   * Adds a log input endpoint to the set of Service endpoints
   * @return {Object} predefined endpoints
   */
  static get endpoints() {
    return {
      ...super.endpoints,
      testIn: {
        in: true,
        default: true,
        receive: "testReceive"
      },
      testOut: {
        out: true,
        default: true
      }
    };
  }

  static get configurationAttributes() {
    return Object.assign(
      createAttributes({
        key3: {
          needsRestart: true,
          private: true
        },
        key4: {}
      }),
      Service.configurationAttributes
    );
  }

  get autostart() {
    return true;
  }

  async configure(config) {
    delete config.name;
    delete config.endpoints;
    delete config.type;
    Object.assign(this, config);
    wait(1000);

    return this.restartIfRunning();
  }

  async testReceive(entry) {}
}

export class ServiceProvider extends ServiceProviderMixin(
  Service,
  TestLogger,
  TestConfig
) {
  static get name() {
    return "service-provider";
  }
}

export async function makeServices(options) {
  const sp = new ServiceProvider(options);
  const ic = new InitializationContext(sp, options);

  await sp.registerService(
    new TestService(
      {
        logLevel: sp.logLevel,
        name: "t2",
        endpoints: { testOut: { connected: "service(logger).log" } }
      },
      ic
    )
  );

  ic.resolveOutstandingEndpointConnections();

  await sp.start();

  return sp;
}
