import { Service } from '@kronos-integration/service';

/**
 * Kronos administration service
 */
export class ServiceAdmin extends Service {
  /**
   * @return {string} 'admin'
   */
  static get name() {
    return 'admin';
  }

  static get endpoints() {
    return {
      ...super.endpoints,
      services: {
        receive: "services"
      }
    };
  }

  async services(params) {
    return this.owner.services;
  }
}

export default ServiceAdmin;
