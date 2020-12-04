import Service  from './service.mjs';
import ServiceProviderMixin from './service-provider-mixin.mjs';

/**
 * Simple service manager (for examples and testing only).
 */
export default class StandaloneServiceProvider extends ServiceProviderMixin(Service) {
  /**
   * @return {string} 'standalone-provider'
   */
  static get name() {
    return 'standalone-provider';
  }

  static get description() {
    return "This service to control services";
  }
}
