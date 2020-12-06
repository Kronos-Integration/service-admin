import { Interceptor } from "@kronos-integration/interceptor";

/**
 * Sends request to the admin service
 */
export class LiveProbeInterceptor extends Interceptor {
  /**
   * @return {string} 'live-probe'
   */
  static get name() {
    return "live-probe";
  }

  async receive(endpoint, next, ...args) {
    console.log("live-probe", ...args);

    if (!this.adminService) {
      const sp = endpoint.owner.owner;
      this.adminService = sp.services.admin;
    }

    this.adminService.requestProbe(endpoint, ...args);

    return next(...args);
  }
}
