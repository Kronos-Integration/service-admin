/* jslint node: true, esnext: true */

"use strict";

const blessed = require('blessed'),
  Server = require('ssh2').Server;

const RE_SPECIAL = /[\x00-\x1F\x7F]+|(?:\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K])/g;
const MAX_MSG_LEN = 128;
const MAX_NAME_LEN = 10;

function noop(v) {}

module.exports = function (service, config) {
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
          accept && accept();
        }).on('window-change', (accept, reject, info) => {
          rows = info.rows;
          cols = info.cols;
          if (stream) {
            stream.rows = rows;
            stream.columns = cols;
            stream.emit('resize');
          }
          accept && accept();
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
              if (line === '/quit' || line === '/exit')
                stream.end();
            }
          });
        });
      });
    }).on('end', () => {}).on('error', err => {});
  }).listen(0, function () {
    service.info({
      message: 'Listening on port',
      port: this.address().port
    });
  });

  return server;
};
