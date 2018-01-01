const path = require('path'),
  process = require('process');

import { sshServer } from './ssh';
import { mergeAttributes, createAttributes } from 'model-attributes';
import { ReceiveEndpoint } from 'kronos-endpoint';
import { Service, defineServiceConsumerProperties } from 'kronos-service';

/**
 * Kronos administration service
 */
export class ServiceAdmin extends Service {
  /**
   * @return {string} 'admin'
   */
  static get name() {
    return 'admin';
  }

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes({
        ssh: {
          description: 'ssh admin interface',
          attributes: {
            port: {
              description: 'listen port',
              needsRestart: true,
              type: 'ip-port'
            },
            hostKeys: {
              description: 'server ssh private host key(s)',
              type: 'blob',
              needsRestart: true
            }
          }
        }
      }),
      Service.configurationAttributes
    );
  }

  constructor(...args) {
    super(...args);

    this.addEndpoint(
      new ReceiveEndpoint('software', this)
    ).receive = async request => {
      return {
        versions: process.versions,
        platform: process.platform
      };
    };
  }

  /**
   * Always start immediate
   * @return {boolean} true
   */
  get autostart() {
    return true;
  }

  async _start() {
    await super._start();

    await defineServiceConsumerProperties(
      this,
      {
        listener: {
          name: 'koa-admin',
          type: 'koa'
        }
      },
      this.owner,
      true
    );

    if (this.ssh !== undefined) {
      this.sshServer = sshServer(this, this.ssh);
    }

    return this.owner.loadFlowFromFile(
      path.join(__dirname, '..', 'admin.flow')
    );
  }

  async _stop() {
    await super._stop();

    if (this.sshServer) {
      return new Promise((fullfill, reject) => {
        this.sshServer.close(err => {
          if (err) {
            reject(err);
            return;
          }
          delete this.sshServer;
          fullfill();
        });
      });
    }
  }
}

export async function registerWithManager(manager) {
  const admin = await manager.registerServiceFactory(ServiceAdmin);
  return manager.declareService({
    type: admin.name,
    name: admin.name
  });
}
