export const data = {
  logger: {
    type: "systemd-logger",
    name: "logger",
    state: "running",
    logLevel: "debug",
    endpoints: {
      log: {
        in: true,
        out: true,
        open: true,
        connected: [
          "service(admin).log",
          "service(auth).log",
          "service(config).log",
          "service(health).log",
          "service(http).log",
          "service(ldap).log",
          "service(logger).log",
          "service(logger).log",
          "service(swarm).log",
          "service(systemctl).log",
          "service(systemd).log"
        ]
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      }
    }
  },
  config: {
    type: "systemd-config",
    name: "config",
    state: "running",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      }
    }
  },
  systemd: {
    type: "systemd",
    name: "systemd",
    state: "starting",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      }
    }
  },
  http: {
    type: "http",
    name: "http",
    state: "running",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      },
      "/services/peers": {
        path: "/services/peers",
        ws: true,
        in: true,
        out: true,
        connected: "service(swarm).peers.services",
        interceptors: [
          {
            type: "decode-json"
          }
        ]
      },
      "/state/uptime": {
        path: "/state/uptime",
        ws: true,
        in: true,
        out: true,
        connected: "service(health).uptime",
        interceptors: [
          {
            type: "decode-json"
          }
        ]
      },
      "/state/cpu": {
        path: "/state/cpu",
        ws: true,
        in: true,
        out: true,
        connected: "service(health).cpu",
        interceptors: [
          {
            type: "decode-json"
          }
        ]
      },
      "/state/memory": {
        path: "/state/memory",
        ws: true,
        in: true,
        out: true,
        connected: "service(health).memory",
        interceptors: [
          {
            type: "decode-json"
          }
        ]
      },
      "/state": {
        path: "/state",
        ws: true,
        in: true,
        out: true,
        connected: "service(health).state",
        interceptors: [
          {
            type: "decode-json"
          }
        ]
      },
      "/authenticate": {
        method: "POST",
        path: "/authenticate",
        out: true,
        open: true,
        connected: "service(auth).access_token",
        interceptors: [
          {
            type: "ctx-body-param"
          }
        ]
      },
      "/services": {
        method: "GET",
        path: "/services",
        out: true,
        open: true,
        connected: "service(admin).services",
        interceptors: [
          {
            type: "ctx-jwt-verify"
          },
          {
            type: "ctx"
          }
        ]
      },
      "/systemctl/status": {
        method: "GET",
        path: "/systemctl/status",
        out: true,
        open: true,
        connected: "service(systemctl).status",
        interceptors: [
          {
            type: "ctx-jwt-verify"
          },
          {
            type: "ctx"
          }
        ]
      },
      "/systemctl/start/:unit": {
        method: "GET",
        path: "/systemctl/start/:unit",
        out: true,
        open: true,
        connected: "service(systemctl).start",
        interceptors: [
          {
            type: "ctx-jwt-verify"
          },
          {
            type: "ctx"
          }
        ]
      },
      "/systemctl/stop/:unit": {
        method: "GET",
        path: "/systemctl/stop/:unit",
        out: true,
        open: true,
        connected: "service(systemctl).stop",
        interceptors: [
          {
            type: "ctx-jwt-verify"
          },
          {
            type: "ctx"
          }
        ]
      },
      "/systemctl/restart/:unit": {
        method: "GET",
        path: "/systemctl/restart/:unit",
        out: true,
        open: true,
        connected: "service(systemctl).restart",
        interceptors: [
          {
            type: "ctx-jwt-verify"
          },
          {
            type: "ctx"
          }
        ]
      },
      "/systemctl/reload/:unit": {
        method: "GET",
        path: "/systemctl/reload/:unit",
        out: true,
        open: true,
        connected: "service(systemctl).reload",
        interceptors: [
          {
            type: "ctx-jwt-verify"
          },
          {
            type: "ctx"
          }
        ]
      }
    }
  },
  ldap: {
    type: "ServiceLDAP",
    name: "ldap",
    state: "stopped",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      },
      authenticate: {
        in: true,
        out: true,
        open: true,
        connected: "service(auth).ldap"
      },
      search: {
        in: true,
        out: true
      }
    }
  },
  health: {
    type: "health-check",
    name: "health",
    state: "running",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      },
      state: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./state"
      },
      cpu: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./state/cpu"
      },
      memory: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./state/memory"
      },
      uptime: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./state/uptime"
      },
      resourceUsage: {
        in: true,
        out: true,
        open: true
      }
    }
  },
  auth: {
    type: "ServiceAuthenticator",
    name: "auth",
    state: "running",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      },
      access_token: {
        in: true,
        open: true,
        connected: "service(http)./authenticate"
      },
      ldap: {
        out: true,
        open: true,
        connected: "service(ldap).authenticate"
      }
    }
  },
  admin: {
    type: "admin",
    name: "admin",
    state: "running",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      },
      services: {
        in: true,
        out: true,
        open: true,
        connected: ["service(http)./services", "service(swarm).topic.services"]
      }
    }
  },
  swarm: {
    type: "swarm",
    name: "swarm",
    state: "starting",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      },
      "topic.services": {
        topic: {},
        in: true,
        out: true,
        connected: "service(admin).services"
      },
      "peers.services": {
        topic: {},
        out: true,
        connected: "service(http)./services/peers"
      }
    }
  },
  systemctl: {
    type: "ServiceSystemdControl",
    name: "systemctl",
    state: "running",
    logLevel: "trace",
    endpoints: {
      log: {
        out: true,
        open: true,
        connected: "service(logger).log"
      },
      config: {
        in: true,
        open: true
      },
      command: {
        in: true,
        open: true
      },
      status: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./systemctl/status"
      },
      start: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./systemctl/start/:unit"
      },
      stop: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./systemctl/stop/:unit"
      },
      restart: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./systemctl/restart/:unit"
      },
      reload: {
        in: true,
        out: true,
        open: true,
        connected: "service(http)./systemctl/reload/:unit"
      }
    }
  }
};
