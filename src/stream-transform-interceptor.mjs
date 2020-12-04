import { Interceptor } from "@kronos-integration/interceptor";
import { pipeline } from "stream";

/**
 * Pipes requests though a transformer stream
 */
export class StreamTransformInterceptor extends Interceptor {
  /**
   * @return {string} 'stream-transform'
   */
  static get name() {
    return "stream-transform";
  }

  createTransformer(endpoint) {}

  async receive(endpoint, next, stream, ...args) {
    return next(pipeline(this.createTransformer(endpoint), stream), ...args);
  }
}
