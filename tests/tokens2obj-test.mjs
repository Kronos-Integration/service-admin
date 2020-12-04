const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const mockReadStream = require("kronos-test-interceptor").mockReadStreamFactory,
  tokens2objs = require("../dist/module").Tokens2ObjectFactory;

describe("stream-line-tokens2obj: test", function () {
  it("Header given by Options. First row skipped as default", function (done) {
    let opts = {
      header: ["A", "B", undefined, "C"]
    };

    let obj = [
      {
        lineNumber: 0,
        data: ["Val 1", "Val 2", "Val 3", "Val 4", "Val 5"]
      },
      {
        lineNumber: 1,
        data: ["2Val 1", "2Val 2", "2Val 3", "2Val 4", "2Val 5"]
      }
    ];

    let header = collect(obj, verify, opts);

    function verify(err, objects, header) {
      assert.notOk(err);

      assert.equal(objects.length, 1);

      assert.deepEqual(objects[0], {
        lineNumber: 1,
        data: {
          A: "2Val 1",
          B: "2Val 2",
          C: "2Val 4"
        }
      });
      done();
    }
  });

  it("Header given by Options. First row skipped as given in the options", function (done) {
    let opts = {
      header: ["A", "B", undefined, "C"],
      skip_first_row: true
    };

    let obj = [
      {
        lineNumber: 0,
        data: ["Val 1", "Val 2", "Val 3", "Val 4", "Val 5"]
      },
      {
        lineNumber: 1,
        data: ["2Val 1", "2Val 2", "2Val 3", "2Val 4", "2Val 5"]
      }
    ];

    let header = collect(obj, verify, opts);

    function verify(err, objects, header) {
      assert.notOk(err);

      assert.equal(objects.length, 1);

      assert.deepEqual(objects[0], {
        lineNumber: 1,
        data: {
          A: "2Val 1",
          B: "2Val 2",
          C: "2Val 4"
        }
      });
      done();
    }
  });

  it("Header given by Options. With the first row", function (done) {
    let opts = {
      header: ["A", "B", undefined, "C"],
      skip_first_row: false
    };

    let obj = [
      {
        lineNumber: 0,
        data: ["Val 1", "Val 2", "Val 3", "Val 4", "Val 5"]
      },
      {
        lineNumber: 1,
        data: ["2Val 1", "2Val 2", "2Val 3", "2Val 4", "2Val 5"]
      }
    ];

    let header = collect(obj, verify, opts);

    function verify(err, objects, header) {
      assert.notOk(err);

      assert.equal(objects.length, 2);

      assert.deepEqual(objects[0], {
        lineNumber: 0,
        data: {
          A: "Val 1",
          B: "Val 2",
          C: "Val 4"
        }
      });
      assert.deepEqual(objects[1], {
        lineNumber: 1,
        data: {
          A: "2Val 1",
          B: "2Val 2",
          C: "2Val 4"
        }
      });
      done();
    }
  });

  // TODO: how could I test this. The stream starts after the done method is called
  // it('ERROR: No header given when parsing', function (done) {
  //   let opts = {
  //     "skip_first_row": true
  //   };
  //
  //   let obj = [{
  //     "lineNumber": 0,
  //     "data": ["Val 1", "Val 2", "Val 3", "Val 4", "Val 5"]
  //   }, {
  //     "lineNumber": 1,
  //     "data": ["2Val 1", "2Val 2", "2Val 3", "2Val 4", "2Val 5"]
  //   }];
  //
  //   let dummyStream = mockReadStream();
  //   dummyStream.add(obj);
  //
  //   let t2o = tokens2objs(opts);
  //   try {
  //     dummyStream.pipe(t2o);
  //   } catch (err) {
  //     assert.equal('Error: No header for transformation availabl.', err);
  //   } finally {
  //     assert.ok(false, "NO error thrown");
  //   }
  //   done();
  //
  // });

  it("ERROR: Strict too less columns", function (done) {
    let opts = {
      header: ["A", "B", undefined, "C"],
      skip_first_row: false,
      strict: true
    };

    let obj = [
      {
        lineNumber: 0,
        data: ["Val 1", "Val 2", "Val 3"]
      }
    ];

    let header = collect(obj, verify, opts, {
      lineNumber: 0,
      errorCode: "TOKENS_2_OBJECT_STRICT_CHECK",
      severity: "skip_record",
      message: `Column count missmatch: The header has 4 columns and the row has 3 columns.`
    });

    function verify(err, objects, header) {
      assert.notOk(err);

      assert.equal(objects.length, 1);

      assert.deepEqual(objects[0], {
        lineNumber: 0,
        data: {
          A: "Val 1",
          B: "Val 2"
        },
        error: [
          {
            lineNumber: 0,
            errorCode: "TOKENS_2_OBJECT_STRICT_CHECK",
            severity: "skip_record",
            message: `Column count missmatch: The header has 4 columns and the row has 3 columns.`
          }
        ]
      });
      done();
    }
  });

  it("ERROR: Strict too much columns", function (done) {
    let opts = {
      header: ["A", "B", undefined, "C"],
      skip_first_row: false,
      strict: true,
      severity: "custom_severity"
    };

    let obj = [
      {
        lineNumber: 0,
        data: ["Val 1", "Val 2", "Val 3", "Val 4", "Val 5"]
      }
    ];

    let header = collect(obj, verify, opts);

    function verify(err, objects, header) {
      assert.notOk(err);

      assert.equal(objects.length, 1);

      assert.deepEqual(objects[0], {
        lineNumber: 0,
        data: {
          A: "Val 1",
          B: "Val 2",
          C: "Val 4"
        },
        error: [
          {
            lineNumber: 0,
            errorCode: "TOKENS_2_OBJECT_STRICT_CHECK",
            severity: "custom_severity",
            message: `Column count missmatch: The header has 4 columns and the row has 5 columns.`
          }
        ]
      });
      done();
    }
  });
});

function collect(objects, verifyFunction, opts) {
  let dummyStream = mockReadStream();
  dummyStream.add(objects);

  let lines = [];

  let t2o = tokens2objs(opts);
  dummyStream
    .pipe(t2o)
    .on("data", function (line) {
      lines.push(line);
    })
    .on("error", function (err) {
      verifyFunction(err, lines);
    })
    .on("header", function (header) {
      //console.log(header);
    })
    .on("end", function () {
      verifyFunction(false, lines);
    });
}
