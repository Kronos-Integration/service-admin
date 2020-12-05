import { Service } from "@kronos-integration/service";
import { instanciateInterceptors } from "@kronos-integration/endpoint";
import { LiveProbeInterceptor } from "./live-probe-interceptor.mjs";

export { LiveProbeInterceptor };

/**
 * Kronos administration service.
 */
export class ServiceAdmin extends Service {
  /**
   * @return {string} 'admin'
   */
  static get name() {
    return "admin";
  }

  static get description() {
    return "Live administration of kronos services";
  }

  static get endpoints() {
    return {
      ...super.endpoints,

      services: {
        multi: true,
        receive: "services",
        didConnect: (endpoint, other) => {
          if (other.direction === "inout") {
            const serviceOwner = endpoint.owner.owner;
            endpoint.send(serviceOwner.services);
            const listener = () => endpoint.send(serviceOwner.services);
            serviceOwner.addListener("serviceStateChanged", listener);
            return () =>
              serviceOwner.removeListener("serviceStateChanged", listener);
          }
        }
      },
      requests: {
        multi: true,
        didConnect: (endpoint, other) => {
          const serviceOwner = endpoint.owner.owner;
          serviceOwner.probeEndpoints.add(endpoint);
          return () => {
            serviceOwner.probeEndpoints.delete(endpoint);
          };
        }
      }
    };
  }

  constructor(config, ic) {
    super(config, ic);

    this.probeEndpoints = new Set();
    this.owner.registerInterceptorFactory(LiveProbeInterceptor);
  }

  async services(params) {
    return this.owner.services;
  }

  requestProbe(endpoint, ...args) {
    this.probeEndpoints.forEach(e => {
      e.receive(endpoint, ...args);
    });
  }

  async execute(command) {
    const owner = this.owner;
    const service = owner.services[command.service];

    switch (command.action) {
      case "start":
        if (service) {
          service.start();
        }
        break;
      case "stop":
        if (service) {
          service.stop();
        }
        break;
      case "restart":
        if (service) {
          service.restart();
        }
        break;

      case "insert":
        if (service) {
          const endpoint = service.endpoints[command.endpoint];
          if (endpoint) {
            if (command.interceptors) {
              endpoint.interceptors.push(
                ...instanciateInterceptors(command.interceptors, owner)
              );
            }
          }
        }
        break;
    }
  }
}

export default ServiceAdmin;
