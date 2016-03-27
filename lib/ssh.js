/* jslint node: true, esnext: true */

"use strict";

const blessed = require('blessed'),
  Server = require('ssh2').Server;

const RE_SPECIAL = /[\x00-\x1F\x7F]+|(?:\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K])/g;
const MAX_MSG_LEN = 128;
const MAX_NAME_LEN = 10;

function noop(v) {}

module.exports = function (service, config) {
  const manager = service.owner;

  const server = new Server(config, client => {
    let stream, name;

    client.on('authentication', ctx => {
      name = ctx.username;
      ctx.accept();
    }).on('ready', () => {
      let rows, cols, term;
      client.once('session', (accept, reject) => {
        accept().once('pty', (accept, reject, info) => {
          rows = info.rows;
          cols = info.cols;
          term = info.term;
          if (accept) { 
            accept();
          }
        }).on('window-change', (accept, reject, info) => {
          rows = info.rows;
          cols = info.cols;
          if (stream) {
            stream.rows = rows;
            stream.columns = cols;
            stream.emit('resize');
          }
          if (accept) { 
            accept();
          }
        }).once('shell', (accept, reject) => {
          stream = accept();

          stream.name = name;
          stream.rows = rows || 24;
          stream.columns = cols || 80;
          stream.isTTY = true;
          stream.setRawMode = noop;
          stream.on('error', noop);

          const screen = new blessed.screen({
            autoPadding: true,
            smartCSR: true,
            program: new blessed.program({
              input: stream,
              output: stream
            }),
            terminal: term || 'ansi'
          });

          screen.title = 'kronos admin';
          // Disable local echo
          //screen.program.attr('invisible', true);

          const output = stream.output = new blessed.log({
            screen: screen,
            top: 0,
            left: 0,
            width: '100%',
            bottom: 2,
            scrollOnInput: true
          });

          screen.append(output);

          screen.append(new blessed.box({
            screen: screen,
            height: 1,
            bottom: 1,
            left: 0,
            width: '100%',
            type: 'line',
            ch: '='
          }));

          const input = new blessed.textbox({
            screen: screen,
            bottom: 0,
            height: 1,
            width: '100%',
            inputOnFocus: true
          });
          screen.append(input);

          input.focus();

          screen.render();
          // XXX This fake resize event is needed for some terminals in order to
          // have everything display correctly
          screen.program.emit('resize');

          const commands = {
            exit() {
                stream.exit();
              },
              help() {
                output.log(`valid commands are: ${Object.keys(commands)}`);
              },
              services() {
                output.log(`services:`);
                Object.keys(manager.services).forEach(n => {
                  output.log(`  ${n}: ${manager.services[n].state}`);
                });
              },
              flows() {
                output.log(`flows:`);
                Object.keys(manager.flows).forEach(n => {
                  output.log(`  ${n}: ${manager.flows[n].state}`);
                });
              },
              interceptors() {
                output.log(`interceptors:`);
                Object.keys(manager.interceptors).forEach(n => {
                  output.log(`  ${n}:`);
                });
              },
              steps() {
                output.log(`steps:`);
                Object.keys(manager.steps).forEach(n => {
                  output.log(`  ${n}:`);
                });
              },
              stop(args) {
                output.log(`stopping service ${args[1]}`);
                const service = manager.services[args[1]];
                service.stop().then(s => {
                  output.log(`${s.name} stopped`);
                });
              },
              loglevel(args) {
                const service = manager.services[args[1]];
                service.logLevel = args[2];
                output.log(`logLevel of ${service.name} set to ${service.logLevel}`);
              },start(args) {
                output.log(`starting service ${args[1]}`);
                const service = manager.services[args[1]];
                service.start().then(s => {
                  output.log(`${s.name} started`);
                });
              },
              restart(args) {
                output.log(`restarting service ${args[1]}`);
                const service = manager.services[args[1]];
                service.restart().then(s => {
                  output.log(`${s.name} restarted`);
                });
              }
          };

          // Read a line of input from the user
          input.on('submit', line => {
            input.clearValue();
            screen.render();
            if (!input.focused)
              input.focus();
            line = line.replace(RE_SPECIAL, '').trim();
            if (line.length > MAX_MSG_LEN)
              line = line.substring(0, MAX_MSG_LEN);
            if (line.length > 0) {
              const tokens = line.split(/\s+/);
              const command = commands[tokens[0]];
              if (command) {
                try {
                  command(tokens);
                } catch (e) {
                  output.log(e);
                  if (tokens[0] === 'exit') {
                    throw e;
                  }
                }
              } else {
                output.log(`unknown command : ${line}`);
                commands.help();
              }
            }
          });
        });
      });
    }).on('end', () => {}).on('error', err => {});
  }).listen(config.port || 0, function () {
    service.info({
      message: 'ssh server listening on port',
      port: this.address().port
    });
  });

  return server;
};
