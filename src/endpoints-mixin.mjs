import {
  SendEndpoint,
  SendEndpointDefault,
  MultiSendEndpoint,
  ReceiveEndpoint,
  ReceiveEndpointDefault,
  ReceiveEndpointSelfConnectedDefault
} from "@kronos-integration/endpoint";

/**
 * Endpoint accessor mixin.
 * Manages endpoints in a container.
 * @param {Class} superclass class to be extended
 * @return {Class} extended class
 */
export default function EndpointsMixin(superclass) {
  return class EndpointsMixin extends superclass {
    /**
     * Default set of endpoints to create.
     * @return {Object} {} empty set
     */
    static get endpoints() {
      return {};
    }

    constructor(...args) {
      super(...args);
      this.endpoints = {};
    }

    /**
     * Add a endpoint.
     * @param {Endpoint} ep
     * @return {Endpoint} the added endpoint
     */
    addEndpoint(ep) {
      this.endpoints[ep.name] = ep;
      return ep;
    }

    /**
     * Deliver the endpoint options for a given endpoint definition.
     * @param {string} name of the endpoint
     * @param {Object} definition endpoints definition
     * @param {string|Function} definition.receive name of method or property
     * @param {InitializationContext} ic
     * @return {Object} suitable to pass as options to the endpoint factory
     */
    endpointOptions(name, definition, ic) {
      if (typeof definition === "string") {
        definition = { connected: definition };
      } else {
        const receive = definition.receive;

        if (typeof receive === "string") {
          if (typeof this[receive] === "function") {
            definition.receive = (...args) => this[receive](...args);
          } else {
            if (this[receive] === undefined) {
              throw new Error(
                `No sucht method or property ${this.name}.${receive}`
              );
            }
            definition.receive = () => this[receive];
          }
        }
      }

      return definition;
    }

    /**
     * Determine endpoint factory from the endpoint config.
     * @param {string} name of the new endpoint
     * @param {Object} definition endpoints definition
     * @param {boolean} definition.in true will result in a ReceiveEndpoint
     * @param {any} definition.receive defined will result in a ReceiveEndpoint
     * @param {boolean} definition.out true will result in a SendEndpoint
     * @param {boolean} definition.default true will result in a (Send|Receive)DefaultEndpoint
     * @param {InitializationContext} ic
     * @return {Object} endpoint factory
     */
    endpointFactoryFromConfig(name, definition, ic) {
      if (definition.connected === "self") {
        return ReceiveEndpointSelfConnectedDefault;
      }

      if (definition.in) {
        return definition.default ? ReceiveEndpointDefault : ReceiveEndpoint;
      }

      if(definition.multi === true || Array.isArray(definition.connected)) {
        return MultiSendEndpoint;
      }

      return definition.default ? SendEndpointDefault : SendEndpoint;
    }

    /**
     * Creates a new endpoint form a defintion.
     * Also creates interceptors if they are present in the definition.
     * @param {string} name of the new endpoint
     * @param {Object|string} definition endpoint attributes or alias expression
     * @param {string} definition.target expression pointing to the connected endpoint
     * @param {InitializationContext} ic
     * @return {Endpoint} newly created endpoint
     */
    createEndpointFromConfig(name, definition, ic) {
      definition = this.endpointOptions(name, definition, ic);

    /*  console.log(
        "EP",
        this.name,
        name,
        this.endpointFactoryFromConfig(name, definition, ic),
        definition
      );*/

      const ep = new (this.endpointFactoryFromConfig(name, definition, ic))(
        name,
        this,
        definition
      );

      ic.connectEndpoint(ep, definition.connected, this.endpoints[name]);

      this.addEndpoint(ep);

      return ep;
    }

    /**
     * Creates the endpoint objects defined as a combination from
     * implementation and definition.
     * All implementation Endpoints are marked as default.
     * @param {Object} definition endpoints definition
     * @param {InitializationContext} ic
     */
    createEndpointsFromConfig(definition, ic) {
      const predefined = Object.fromEntries(
        Object.entries(this.constructor.endpoints).map(([name, def]) => [
          name,
          { default: true, ...def }
        ])
      );

      for (const [name, def] of Object.entries(
        Object.assign(predefined, definition)
      )) {
        this.createEndpointFromConfig(name, def, ic);
      }
    }

    /**
     * Removes a endpoint.
     * @param {string} name name of the endpoint to be removed
     * @return {undefined}
     */
    removeEndpoint(name) {
      delete this.endpoints[name];
    }

    /**
     * Deliver all _in_ endpoints.
     * @return {Endpoint[]} of all in endpoints
     */
    get inEndpoints() {
      return Object.values(this.endpoints).filter(e => e.isIn);
    }

    /**
     * Deliver all _out_ endpoints.
     * @return {Endpoint[]} of all out endpoints
     */
    get outEndpoints() {
      return Object.values(this.endpoints).filter(e => e.isOut);
    }

    /**
     * Find Endpoint for a given expression.
     * Default implementation only supports direct named endpoints.
     * @param {string} expression to identify endpoint
     * @param {Endpoint} from to identify endpoint
     * @return {Endpoint} for a given expression
     * @throws if no Endpoint can be found and throwOnError is true
     */
    endpointForExpression(expression, from) {
      const endpoint = this.endpoints[expression];
      if (endpoint === undefined) {
        const m = expression.match(/^service\(([^\)]+)\).(.*)/);
        if (m) {
          const serviceName = m[1];
          const suffixExpression = m[2];
          const serviceProvider = this.owner;
          const service = serviceProvider.getService(serviceName);

          return service
            ? service.endpointForExpression(suffixExpression)
            : undefined;
        }

        if (from !== undefined) {
          if (expression === "self") {
            return from;
          }
        }
      }

      return endpoint;
    }
  };
}
