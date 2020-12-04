import { Interceptor } from '@kronos-integration/interceptor';
import { Obj2String } from './obj2string.mjs';

/**
 * This interceptor cares about the handling of the messages.
 * It will add the hops and copies the messages
 */
export class Stream2ObjectInterceptor extends Interceptor {
  static get name() {
    return 'stream-obj-to-string';
  }

 async receive(endpoint, next, request) {
    const streamFilter = new Obj2String(this);
    return next(stream.pipe(streamFilter));
  }
}

export default Stream2ObjectInterceptor;
