import { Service } from "@kronos-integration/service";

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
      }
    };
  }

  async services(params) {
    return this.owner.services;
  }
}

export default ServiceAdmin;
