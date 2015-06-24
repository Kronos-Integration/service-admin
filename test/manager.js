/* global describe, it*/
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai');
chai.use(require("chai-as-promised"));
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const kronos = require('../lib/manager.js');

describe('service manager', function () {
  const flowDecl = {
    "flow1": {
      "steps": {
        "s1": {
          "type": "kronos-copy",
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

  describe('creation', function () {
    it('promise should be fullfilled', function () {
      const promise = kronos.manager({
        flows: flowDecl
      });
      return promise.should.be.fulfilled;
    });
  });
});
