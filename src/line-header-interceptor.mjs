import { Interceptor } from "@kronos-integration/interceptor";
import { LineHeaderFactory } from "./line-header.mjs";

/**
 * This interceptor cares about the handling of the messages.
 * It will add the hops and copies the messages
 */
export class LineHeaderInterceptor extends Interceptor {
  constructor(config, endpoint) {
    super(config, endpoint);

    // just validate the config once
    LineHeaderFactory(config, true);
  }

  static get name() {
    return "line-header";
  }

  receive(request, oldRequest) {
    if (request.payload) {
      const streamFilter = LineHeaderFactory(this.config);
      const stream = request.payload;
      request.payload = stream.pipe(streamFilter);
    }
    return this.connected.receive(request, oldRequest);
  }
}

export default LineHeaderInterceptor;