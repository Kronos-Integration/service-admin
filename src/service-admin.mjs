import { Service } from "@kronos-integration/service";
import { Endpoint, instanciateInterceptors } from "@kronos-integration/endpoint";
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

      command: {
        in: true,
        receive: "execute"
      },

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
          const sp = endpoint.owner.owner;
          const admin = sp.services.admin;
          admin.probeEndpoints.add(endpoint);
          return () => {
            admin.probeEndpoints.delete(endpoint);
          };
        }
      }
    };
  }

  probeEndpoints = new Set();

  constructor(config, ic) {
    super(config, ic);

    this.owner.registerInterceptorFactory(LiveProbeInterceptor);
  }

  async services(command) {
    if (command) {
      await this.execute(command);
    }
    return this.owner.services;
  }

  /**
   * Sends passing requst to all registerd endpoints.
   * @param {Endpoint} endpoint 
   * @param {any} args 
   */
  requestProbe(endpoint, ...args) {
    this.probeEndpoints.forEach(e => e.send(endpoint, ...args));
  }

  async execute(command) {
    const owner = this.owner;
    const service = owner.services[command.service];

    if (service) {
      switch (command.action) {
        case "start":
          await service.start();
          break;
        case "stop":
          await service.stop();
          break;
        case "restart":
          await service.restart();
          break;

        case "insert":
          const endpoint = service.endpoints[command.endpoint];
          if (endpoint) {
            if (command.interceptors) {
              endpoint.interceptors.push(
                ...instanciateInterceptors(command.interceptors, owner)
              );
            }
          }
          break;
      }
    }
  }
}

export default ServiceAdmin;
