import { Interceptor } from "@kronos-integration/interceptor";
import { addHop, createMessage } from 'kronos-message';

/**
 * This interceptor cares about the handling of the messages.
 * It will add the hops and copies the messages
 */
export class MessageHandlerInterceptor extends Interceptor {
  static get name() {
    return 'message-handler';
  }

  receive(request, oldRequest) {
    const newRequest = createMessage(request, oldRequest);
    addHop(
      newRequest,
      this.endpoint.owner.name,
      this.endpoint.owner.type,
      this.endpoint.name
    );

    return this.connected.receive(newRequest, oldRequest);
  }
}

export function registerWithManager(manager) {
  return manager.registerInterceptor(MessageHandlerInterceptor);
}
