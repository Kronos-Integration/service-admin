/* global describe, it*/
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai');
chai.use(require("chai-as-promised"));
const assert = chai.assert;
const expect = chai.expect;

const kronos = require('../lib/manager.js');

describe('service manager', function () {
  const flowDecl = {
    "myFlow": {
      "steps": {
        "s1": {
          "type": "copy",
          "config": {
            "key1": "value1"
          },
          "endpoints": {
            "in": "stdin",
            "out": function* () {
              do {
                let request =
                  yield;
              } while (true);
            }
          }
        }
      }
    }
  };

  describe('buildin step implementations', function () {
    it('should be present', function (done) {
      kronos.manager({
        flows: flowDecl
      }).then(function (manager) {
        done();
      });
    });
  });
});
