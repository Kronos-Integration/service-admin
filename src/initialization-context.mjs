import { LogLevelMixin } from "loglevel-mixin";

import {
  isEndpoint,
  Endpoint,
  DummyReceiveEndpoint
} from "@kronos-integration/endpoint";

/**
 * Keeps track of all in flight object creations and loose ends during config initialization.
 */
export const InitializationContext = LogLevelMixin(
  /**
   * @param {ServiceProvider} serviceProvider
   * @param {Object} options
   * @param {string} options.logLevel
   */
  class InitializationContext {
    constructor(serviceProvider, options) {
      this.serviceProvider = serviceProvider;
      this.outstandingServices = new Map();
      this.outstandingFactories = new Map();
      this.outstandingEndpointConnections = new Map();
    }

    /**
     * Forward to the serviceProvider
     * @param {string} level the log level
     * @param {Object} arg log content
     */
    log(level, ...args) {
      if (this.serviceProvider) {
        this.serviceProvider.log(level, ...args);
      } else {
        console.log(...args);
      }
    }

    /**
     * Wait for (Service) factory to be declared when aced for a service.
     *
     * @return {boolean} true we wait until a factory is known
     */
    get waitForFactories() {
      return true;
    }

    ownerOfService(service) {
      return this.serviceProvider;
    }

    /**
     * Connects an endpoint.
     * If the other side is currently not present a dummy endpoint will be created
     * and listed as outstanding endpoint connection.
     * @param {Endpoint} endpoint
     * @param {string} connected
     */
    connectEndpoint(endpoint, connected) {
      if (connected === undefined) {
        return;
      }

      if (Array.isArray(connected)) {
        for (const c of connected) {
          this.connectEndpoint(endpoint, c);
        }
        return;
      }

      let other = connected;
      if (!isEndpoint(connected)) {
        other = this.endpointForExpression(connected, endpoint);
      }

      if (other) {
        endpoint.addConnection(other);
        this.trace(level => `${endpoint} ${connected} (connected)`);
      } else {
        this.trace(level => `${endpoint} ${connected} (connect deffered)`);

        endpoint.addConnection(
          new DummyReceiveEndpoint(endpoint.name, endpoint.owner)
        );

        this.addOutstandingEndpointConnection(endpoint, connected);
      }
    }

    /**
     * Find endpoint for a given expression.
     * @param {string} expression
     * @param {Endpoint} from
     */
    endpointForExpression(expression, from) {
      if (this.serviceProvider) {
        const endpoint = this.serviceProvider.endpointForExpression(
          expression,
          from
        );
        if (endpoint) {
          return endpoint;
        }
      }

      if (from !== undefined) {
        return from.owner.endpointForExpression(expression);
      }
    }

    /**
     *
     * @param {Endpoint} endpoint
     * @param {string} connected
     */
    addOutstandingEndpointConnection(endpoint, connected) {
      this.outstandingEndpointConnections.set(endpoint, connected);
    }

    resolveOutstandingEndpointConnections() {
      for (const [
        endpoint,
        connected
      ] of this.outstandingEndpointConnections.entries()) {
        const c = this.endpointForExpression(connected, endpoint);
        if (c) {
          for (const pc of endpoint.connections()) {
            if (pc.isDummy) endpoint.removeConnection(pc);
          }

          endpoint.addConnection(c);

          this.outstandingEndpointConnections.delete(endpoint);
          this.trace(level => `${endpoint} (connection resolved)`);
        } else {
          this.error(level => `Unable to connect ${endpoint} ${connected}`);
        }
      }
    }

    /**
     * Checks the service providers endpoint for beeing not connected.
     */
    validateEndpoints() {
      Object.values(this.serviceProvider.services).forEach(s => {
        for (const o of s.outEndpoints) {
          if (!o.hasConnections) {
            this.error(`${o.identifier} is not connected`);
          }
        }
      });
    }

    /**
     *
     * @param {string|class} type name if type
     */
    async getServiceFactory(type) {
      const sp = this.serviceProvider;

      if (type instanceof Function) {
        const factory = sp.serviceFactories[type.name];
        if (factory !== undefined) {
          return factory;
        }
        return sp.registerServiceFactory(type);
      }

      const factory = sp.serviceFactories[type];
      if (factory) {
        return factory;
      }

      let typePromise = this.outstandingFactories.get(type);
      if (typePromise !== undefined) {
        return typePromise;
      }

      if (this.waitForFactories) {
        typePromise = new Promise((resolve, reject) => {
          const listener = factory => {
            if (factory.name === type) {
              this.outstandingFactories.delete(type);
              sp.removeListener("serviceFactoryRegistered", listener);
              resolve(factory);
            }
          };

          sp.addListener("serviceFactoryRegistered", listener);
        });

        this.outstandingFactories.set(type, typePromise);

        return typePromise;
      }
    }

    /**
     * - if there is already a service for the given name configure it and we are done
     * - if there is already an outstanding declaration ongoing wait until it is done configure it done
     * - otherewise declare this action as a new outstanding service declaration
     * @param {Object} config
     * @param {string} name service name
     * @return {Service}
     */
    async declareService(config, name) {
      const sp = this.serviceProvider;
      let service = sp.getService(name);

      if (service !== undefined) {
        await service.configure(config);
        return service;
      }

      let servicePromise = this.outstandingServices.get(name);
      if (servicePromise) {
        service = await servicePromise;
        await service.configure(config);
        return service;
      }

      config.name = name;

      // service factory not present? wait until one arrives
      const type = config.type || config.name;

      const clazz = await this.getServiceFactory(type);

      if (clazz) {
        if (sp.services.config) {
          config = await sp.services.config.configFor(name, config);
        }

        servicePromise = sp.registerService(new clazz(config, this));
        this.outstandingServices.set(name, servicePromise);

        service = await servicePromise;
        this.outstandingServices.delete(name);

        if (sp.services.config) {
          sp.services.config.clearPreserved(name);
        }

        this.resolveOutstandingEndpointConnections();
        return service;
      }

      //   throw new Error(`No factory for ${type}`);
    }
  }
);
