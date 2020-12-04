import { defaultLogLevels, LogLevelMixin, makeLogEvent } from "loglevel-mixin";
import { prepareActions, StateTransitionMixin } from "statetransition-mixin";
import {
  createAttributes,
  getAttribute,
  getAttributes,
  setAttributes
} from "model-attributes";
import EndpointsMixin from "./endpoints-mixin.mjs";

/**
 * Key of the service description.
 */
const DESCRIPTION = Symbol("description");

const _ca = createAttributes({
  description: {
    type: "string",
    description: "human readable description of the step"
  },
  logLevel: {
    description: `logging level one of: ${Object.keys(defaultLogLevels)}`,
    default: defaultLogLevels.info,
    type: "string",
    setter(newValue) {
      if (newValue !== undefined) {
        this.logLevel = newValue;
        return true;
      }
      return false;
    },
    getter() {
      return this.logLevel.name;
    }
  },
  timeout: {
    attributes: {
      start: {
        description: "service start timeout",
        type: "duration",
        default: 20
      },
      stop: {
        description: "service stop timeout",
        type: "duration",
        default: 20
      },
      restart: {
        description: "service restart timeout",
        type: "duration",
        default: 20
      }
    }
  }
});

const timeout = 20000;

const rsfDefault = {
  target: "running",
  during: "starting",
  rejected: "failed",
  timeout
};

const ssfDefault = {
  target: "stopped",
  during: "stopping",
  rejected: "failed",
  timeout
};

/**
 * Service
 * The initial state is 'stopped'
 * All services have at least three endpoints:
 * - log _out_: log events
 * - config _in_: configuration request
 * - command _in_: administrative actions to be executed by the step
 * @param {Object} config
 * @param {string} config.name
 * @param {string} config.logLevel
 * @param {boolean} config.autostart defaults to false
 * @param {string} config.description human readable description
 * @param {Object} config.endpoints will be merged with the build in ones
 * @param {InitializationContext} ic
 */
export default class Service extends EndpointsMixin(
  StateTransitionMixin(
    LogLevelMixin(class {}),
    prepareActions({
      start: {
        stopped: rsfDefault
      },
      restart: {
        stopped: rsfDefault,
        running: {
          target: "running",
          during: "restarting",
          timeout
        }
      },
      stop: {
        running: ssfDefault,
        starting: ssfDefault,
        failed: ssfDefault
      }
    }),
    "stopped"
  )
) {
  static get description() {
    return "This service is the base class for service implementations";
  }

  static get name() {
    return "service";
  }

  /**
   * Meta information for the config attributes.
   * - default optional default value of the attribute
   * - needsRestart optional modification requires a service restart
   * - setter(newValue,attribute) optional function to be used if simple value assignment is not enough
   * The Service class only defines the logLevel, and start/stop/restart timeout attribute
   * @return {Object}
   */
  static get configurationAttributes() {
    return _ca;
  }

  /**
   * Definition of the predefined endpoints.
   * - log _out_
   * - config _in_
   * - command _in_
   * @return {Object} predefined endpoints
   */
  static get endpoints() {
    return {
      log: {
        connected: "service(logger).log"
      },
      config: {
        in: true,
        receive: "configure"
      },
      command: {
        in: true,
        receive: "execute"
      }
    };
  }

  constructor(config, ic) {
    super();

    const owner = ic.ownerOfService(this);
    if (owner !== undefined) {
      Object.defineProperty(this, "owner", {
        value: owner
      });
    }

    if (config === undefined) {
      config = {};
    } else {
      const properties = ["name", "autostart"].reduce((all, name) => {
        if (config[name] !== undefined) {
          all[name] = { value: config[name] };
        }
        return all;
      }, {});

      Object.defineProperties(this, properties);
    }

    if (process.env.LOGLEVEL) {
      this.logLevel = config.logLevel = process.env.LOGLEVEL;
    } else if (process.env.DEBUG) {
      this.logLevel = config.logLevel = "debug";
    }

    this.createEndpointsFromConfig(config.endpoints, ic);
    this._configure(config);
  }

  instantiateInterceptor(options) {
    return this.owner.instantiateInterceptor(options);
  }

  get configurationAttributes() {
    return this.constructor.configurationAttributes;
  }

  get type() {
    return this.constructor.name;
  }

  get description() {
    return this[DESCRIPTION] || this.constructor.description;
  }

  set description(desc) {
    this[DESCRIPTION] = desc;
  }

  /**
   * Used in human readable state messages.
   * Besides the actual service name it may contain additional short hints.
   * @return {string}
   */
  get extendetName() {
    return this.name;
  }

  async execute(command) {
    // TODO admin query language ?
    // for now we return the config

    const ca = this.configurationAttributes;

    for (const an in ca) {
      getAttribute(this, ca, an);
    }

    return {
      name: this.name,
      state: this.state
    };
  }

  /**
   * Called when the service state changes.
   * Emits a serviceStateChanged event to the owner.
   * @param {string} oldState
   * @param {string} newState
   */
  stateChanged(oldState, newState) {
    this.owner.serviceStateChanged(this, oldState, newState);
    this.trace({
      message: `${this.extendetName}: transitioned from ${oldState} to ${newState}`,
      from: oldState,
      state: newState
    });
  }

  stateTransitionRejection(rejected, newState) {
    const p = super.stateTransitionRejection(rejected, newState);
    this.error({
      message: `${this.extendetName}: transition aborted`,
      rejected,
      newState
    });
    return p;
  }

  /**
   * Called when state transition is not allowed.
   * @param {string} action originating action name
   * @throws always
   */
  async rejectWrongState(action) {
    throw new Error(`Can't ${action} ${this}`);
  }

  /**
   * Deliver transition timeout.
   * @param {Object} transition
   * @return {number} milliseconds before throwing for a long running transition
   */
  timeoutForTransition(transition) {
    const timeout = this.timeout[transition.name];
    return timeout === undefined
      ? super.timeoutForTransition(transition)
      : timeout;
  }

  /**
   * Opens all endpoint connections.
   */
  async _start() {
    for (const e of Object.values(this.endpoints)) {
      e.openConnections();
    }
  }

  /**
   * Closes all endpoint connections.
   */
  async _stop() {
    for (const e of Object.values(this.endpoints)) {
      e.closeConnections();
    }
  }

  /**
   * Restart action.
   * default implementation does a _stop() and a _start()
   * @return {Promise} fulfills after start
   */
  async _restart() {
    await this._stop();
    return this._start();
  }

  /**
   * Restarts if in running mode.
   * Otherwise does nothing.
   * @returns {Promise} resolves when restart is done (or immediate if no restart triggered)
   */
  async restartIfRunning() {
    if (this.state === "running") {
      return this.restart();
    }
  }

  /**
   * Mapping of properties used in toString.
   * @return {Object}
   */
  get toStringAttributes() {
    return { state: "state" };
  }

  /**
   * Returns the string representation of this service.
   * @return {string} human readable name
   */
  toString() {
    return `${this.name}(${Object.entries(this.toStringAttributes)
      .map(([name, prop]) => `${name}=${this[prop]}`)
      .join(",")})`;
  }

  toJSON() {
    return this.toJSONWithOptions({
      includeRuntimeInfo: true,
      includeDefaults: true,
      includeName: true,
      includeConfig: true,
      includePrivate: false
    });
  }

  /**
   * Deliver json representation.
   * @param {Object} options
   * @param {boolean} options.includeRuntimeInfo include runtime informtion like state
   * @param {boolean} options.includeDefaults include default endpoints
   * @param {boolean} options.includeName include name of the service
   * @param {boolean} options.includeConfig include config attributes
   * @param {boolean} options.includePrivate include private config attributes
   * @return {Object} json representation
   */
  toJSONWithOptions(options) {
    const json = {
      type: this.type
    };

    if (options.includeName) {
      json.name = this.name;
    }

    if (options.includeRuntimeInfo) {
      json.state = this.state;
      json.logLevel = this.logLevel;
    }

    if (options.includeConfig) {
      let atts = getAttributes(this, this.configurationAttributes);

      if (!options.includePrivate) {
        atts = Object.fromEntries(
          Object.entries(atts).filter(([k, v]) => !v.private)
        );
      }

      Object.assign(json, atts);
    }

    for (const endpointName in this.endpoints) {
      const ep = this.endpoints[endpointName];

      function add(ep) {
        if (json.endpoints === undefined) {
          json.endpoints = {};
        }
        json.endpoints[endpointName] = ep.toJSONWithOptions(options);
      }

      if (ep.isDefault) {
        if (options.includeDefaults) {
          add(ep);
        }
      } else {
        add(ep);
      }
    }

    return json;
  }

  /**
   * Defaults to the type.
   * @return {string} type
   */
  get name() {
    return this.type;
  }

  /**
   * Should we start when beeing registered.
   * @return {boolean} false
   */
  get autostart() {
    return false;
  }

  /**
   * Takes attribute values from config parameters
   * and copies them over to the object.
   * Copying is done according to configurationAttributes.
   * Which means we loop over all configuration attributes.
   * and then for each attribute decide if we use the default, call a setter function
   * or simply assign the attribute value.
   * @param {Object} config
   * @return {Set} of modified attributes
   */
  _configure(config) {
    const modified = new Set();
    setAttributes(
      this,
      this.configurationAttributes,
      config,
      (ca, path, value) => {
        this.trace(level => {
          if (ca.private) {
            value = "***";
          }
          return {
            message: `config ${this.name}, ${path}: ${JSON.stringify(value)}`,
            attribute: path,
            value: value
          };
        });
        modified.add(ca);
      }
    );
    return modified;
  }

  /**
   * Use new configuration.
   * Internally calls _configure(config) as the constructor does.
   * If attribute with needsRestart are touched the restartIfRunning method
   * will be called.
   * @param {Object} config
   * @return {Promise} fillfills when config is applied
   */
  async configure(config) {
    const modified = this._configure(config);

    for (const a of modified) {
      if (a.needsRestart) {
        return this.restartIfRunning();
      }
    }
  }

  /**
   * Adds service name to the log event.
   * @param {string} level the log level
   * @param {Object} arg log content
   */
  log(level, arg) {
    this.endpoints.log.send(
      makeLogEvent(level, arg, {
        service: this.name
      })
    );
  }
}
