import { Interceptor } from "@kronos-integration/interceptor";
import { parserFactory } from "./data-processor-row.mjs";

/**
 * This interceptor cares about the handling of the messages.
 * It will add the hops and copies the messages
 */
export class RowProcessorInterceptor extends Interceptor {
  constructor(config, endpoint) {
    super(config, endpoint);

    // just validate the config once
    parserFactory(config.config, true);
  }

  static get name() {
    return "data-processor-row";
  }

  receive(request, oldRequest) {
    if (request.payload) {
      const streamFilter = parserFactory(this.config.config);
      const stream = request.payload;
      request.payload = stream.pipe(streamFilter);
    }
    return this.connected.receive(request, oldRequest);
  }
}

export default RowProcessorInterceptor;
