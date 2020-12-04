import { Stream2ObjectInterceptor } from "../src/stream2object-interceptor.mjs";
import { interceptorTest, testResponseHandler } from "kronos-test-interceptor";
import test from "ava";

const stream = require("stream");

const logger = {
  debug(a) {
    console.log(a);
  }
};

function dummyEndpoint(name) {
  return {
    get name() {
      return name;
    },
    get path() {
      return "/get:id";
    },
    toString() {
      return this.name;
    },
    step: logger
  };
}

class MockWriteStream extends stream.Writable {
  constructor() {
    super({
      objectMode: true,
      highWaterMark: 16
    });

    // Stores the data written
    this.objectStack = [];
  }

  _write(chunk, encoding, callback) {
    this.objectStack.push(chunk);
    callback();
  }
}

test(
  "basic",
  interceptorTest,
  Stream2ObjectInterceptor,
  dummyEndpoint("ep1"),
  {},
  "stream-obj-to-string",
  async (t, interceptor, withConfig) => {
    t.deepEqual(interceptor.toJSON(), {
      type: "stream-obj-to-string"
    });

    if (!withConfig) return;

    interceptor.connected = dummyEndpoint("ep");
    interceptor.connected.receive = testResponseHandler;

    /*
    const dummyStream = mockReadStreamFactory();
    dummyStream.add({
      name: 'Matt',
      line_number: 3
    });
    dummyStream.add({
      last_name: 'Herbert'
    });

    const sendMessage = {
      info: 'first message',
      payload: dummyStream
    };

    const writer = new MockWriteStream();

    writer.on('finish', val => {
      t.is(writer.objectStack.length, 2);
      t.is(writer.objectStack[0], '{"name":"Matt","line_number":3}\n');
      t.is(writer.objectStack[1], '{"last_name":"Herbert"}\n');
      done();
    });

    const mockReceive = new MockReceiveInterceptor(function(
      request,
      oldRequest
    ) {
      assert.ok(request);

      request.payload.pipe(writer);
    });

    messageHandler.connected = mockReceive;
    messageHandler.receive(sendMessage);
    */
  }
);
