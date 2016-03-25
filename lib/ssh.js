/* jslint node: true, esnext: true */

"use strict";

const ssh2 = require('ssh2');


module.exports = function (config) {
  const server = new ssh2.Server(config, client => {
    client.on('authentication', ctx => {
      console.log('authentication');
      ctx.accept();
    });

    client.on('ready', ctx => {
      client.on('session', (accept, reject) => {
        const session = accept();
        session.on('exec', function (accept, reject, info) {
          console.log('Client wants to execute: ' + info.command);
          const stream = accept();
          stream.stderr.write('Oh no, the dreaded errors!\n');
          stream.write('Just kidding about the errors!\n');
          stream.exit(0);
          stream.end();
        });
      });
    });
  });

  server.listen(0, '127.0.0.1', function () {
    console.log('Listening on port ' + this.address().port);
  });

  return server;
};
