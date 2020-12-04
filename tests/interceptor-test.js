/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

/*
 * Just test if the message will be passed through the interceptor
 */

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  InterceptorUnderTest = require('../index').Interceptor,
  MockReceiveInterceptor = require('kronos-test-interceptor').MockReceiveInterceptor;


const stepMock = {
  "name": "dummy step name",
  "type": "dummy step type"
};

const checkProperties = {
  "config": {
    "namus": {
      "fieldType": {
        "type": "boolean",
      },
      "defaultValue": "false",
      "mandatory": true,
      "severity": "abort_file"
    }
  }
};

describe('Interceptor test', function () {

  it('Create', function () {
    const endpoint = {
      "owner": stepMock,
      "name": "gumboIn"
    };
    const messageHandler = new InterceptorUnderTest(checkProperties, endpoint);
    assert.ok(messageHandler);
  });

  it('Send message', function (done) {
    const endpoint = {
      "owner": stepMock,
      "name": "gumboIn"
    };

    const sendMessage = {
      "info": "first message"
    };

    const messageHandler = new InterceptorUnderTest(checkProperties, endpoint);
    const mockReceive = new MockReceiveInterceptor(function (request, oldRequest) {

      assert.ok(request);

      assert.deepEqual(request, {
        "info": "first message"
      });
      done();
    });

    messageHandler.connected = mockReceive;

    messageHandler.receive(sendMessage);

  });



});
