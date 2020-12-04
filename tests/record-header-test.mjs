/*global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const _ = require('underscore');
const mockReadStream = require('kronos-test-interceptor').mockReadStreamFactory,
  checkHeaderFactory = require('../dist/module').LineHeaderFactory;

// The meta info for the check
const expected_1 = ["col_1", "col_2", "col_3", "col_4", "col_5", "col_6"];
const expected_2 = ["col_1", "col_2", "col_3", "col 4", "col_5", "col_6"];
const expected_3 = ["col_1", "col_2", "col_3", "c4", "col_5", "col_6"];
const actual_otherOrder = ["col_1", "col_3", "col_4", "col_2", "col_5", "col_6"];
const actual_otherOrder_plus = ["col_1", "col_3", "col_4", "gum", "col_2", "col_5", "col_6"];
const actual_missingOne = ["col_1", "col_2", "col_4", "col_5", "col_6"];
const actual_missingTwo = ["col_1", "col_2", "col_4", "col_5"];
const actual_otherOrder_plus_mixed = ["COL_1", "col_3", "COL_4", "gum", "col_2", "COL_5", "cOl_6"];


const checkProperties = {
  "expectedHeader": ["col_1", "col_2", "col_3", ["col_4", "col 4", "c4"], "col_5", "col_6"],
  "fieldNames": ["c1", "c2", "c3", "c4", "c5", "c6"],
  "caseSensitive": true,
  "strict": {
    "val": true,
    "severity": "skip_record"
  },
  "additionalColumns": false,
  "missingColumns": false,
  "mandatoryColumns": ["gum"],
  "severity": "abort_file"
};



describe("stream-line-header: Check amount of checks being created", function () {

  it("Valid 1. Expect all checks to be created", function () {
    const checks = checkHeaderFactory(checkProperties).checks;
    checks.length.should.equal(4);
  });

  it("Valid 2. Removed mandatory columns checks (This check will not be in the list anyhow)", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(4);
  });

  it("Valid 3. Removed missing columns checks", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(3);
  });

  it("Valid 4. Removed additional columns checks", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    cp.additionalColumns = true;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);
  });

  it("Valid 5. Removed stric columns checks", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = false;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(1);
  });
});


// Run the tests
describe("stream-line-header: Test additionalColumns columns", function () {
  it("Valid header with additional columns", function () {
    let cp = _.clone(checkProperties);
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = false;
    delete(cp.mandatoryColumns);
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(1);

    const err = checks[0](actual_otherOrder_plus);
    should.not.exist(err);
  });
  it("InValid header with additional columns", function () {
    let cp = _.clone(checkProperties);
    cp.missingColumns = true;
    cp.additionalColumns = false;
    cp.strict.val = false;
    delete(cp.mandatoryColumns);
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);

    const err = checks[1](actual_otherOrder_plus);
    should.exist(err);
    err.errorCode.should.equal("CHECK_HEADER_ADDITIONAL_COLUMNS");
  });
});


describe("stream-line-header: Test missing columns", function () {
  it("Valid header with missing columns", function () {
    let cp = _.clone(checkProperties);
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = false;
    delete(cp.mandatoryColumns);
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(1);

    const err = checks[0](actual_missingTwo);
    should.not.exist(err);
  });
  it("InValid header with missing columns", function () {
    let cp = _.clone(checkProperties);
    cp.missingColumns = false;
    cp.additionalColumns = true;
    cp.strict.val = false;
    delete(cp.mandatoryColumns);
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);

    const err = checks[1](actual_missingTwo);
    should.exist(err);
    err.errorCode.should.equal("CHECK_HEADER_MISSING_COLUMNS");

  });
});

describe("stream-line-header: Test strict check", function () {
  it("Valid header alternative 1", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = true;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);

    const err = checks[1](expected_1);
    should.not.exist(err);
  });
  it("Valid header alternative 2", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = true;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);

    const err = checks[1](expected_2);
    should.not.exist(err);
  });

  it("InValid header wrong order", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = true;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);

    const err = checks[1](actual_otherOrder);
    should.exist(err);
    err.errorCode.should.equal("CHECK_HEADER_NO_STRICT_MATCH");
  });

  it("InValid header additional column", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = true;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);

    const err = checks[1](actual_otherOrder_plus);
    should.exist(err);
    err.errorCode.should.equal("CHECK_HEADER_NO_STRICT_MATCH");
  });

  it("InValid header additional column; case insensitive", function () {
    let cp = _.clone(checkProperties);
    delete cp.mandatoryColumns;
    cp.missingColumns = true;
    cp.caseSensitive = false;
    cp.additionalColumns = true;
    cp.strict.val = true;
    const checks = checkHeaderFactory(cp).checks;
    checks.length.should.equal(2);

    const err = checks[1](actual_otherOrder_plus_mixed);
    should.exist(err);
    err.errorCode.should.equal("CHECK_HEADER_NO_STRICT_MATCH");
  });
});



describe("stream-line-header: Test mandatory columns", function () {
  it("Valid header", function () {
    let cp = _.clone(checkProperties);

    cp.mandatoryColumns = {
      "val": [
        "col_1", "col_4", "col_5"
      ],
      "severity": cp.severity
    };

    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = false;
    const streamHeader = checkHeaderFactory(cp, true);
    const checks = streamHeader.checks;
    checks.length.should.equal(1);

    const err = streamHeader.mandatoryColumnCheck(actual_missingTwo);
    should.not.exist(err);
  });

  it("InValid header, mandatory column missing", function () {
    let cp = _.clone(checkProperties);
    cp.mandatoryColumns = ["col_1", "c1a", "col_5"];
    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = false;
    const streamHeader = checkHeaderFactory(cp);
    const checks = streamHeader.checks;
    checks.length.should.equal(1);

    const err = streamHeader.mandatoryColumnCheck(actual_missingTwo);
    should.exist(err);
    err.errorCode.should.equal("CHECK_HEADER_MANDATORY_COLUMNS");
  });
});

describe("stream-line-header: Real column fields", function () {
  it("Check real positions", function () {
    let cp = _.clone(checkProperties);

    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = false;
    const streamHeader = checkHeaderFactory(cp, true);
    const checks = streamHeader.checks;
    checks.length.should.equal(1);


    let fieldData = ["col_6", "col_3", "col_7", "col 4", "col_9", "col_1"];
    let fieldMap = streamHeader.fieldMapCheck(fieldData);

    let header = [];
    let foundColumns = [];
    for (let i = 0; i < fieldData.length; i++) {
      header[i] = fieldMap[i];
      if (fieldMap[i]) {
        foundColumns.push(fieldMap[i]);
      }
    }

    assert.deepEqual(header, ["c6", "c3", undefined, "c4", undefined, "c1"]);

  });
});

describe("stream-line-header: Run the stream", function () {

  it('No errors', function (done) {

    let cp = _.clone(checkProperties);

    cp.missingColumns = true;
    cp.additionalColumns = true;
    cp.strict.val = false;
    cp.mandatoryColumns = ["c1", "c3", "c6"];

    let obj = {
      "lineNumber": 0,
      "data": ["col_6", "col_3", "col_7", "col 4", "col_9", "col_1"]
    };

    let header = collect(obj, verify, cp);

    function verify(err, objects, header) {
      assert.notOk(err);

      assert.equal(objects.length, 1);

      assert.deepEqual(objects[0], {
        "lineNumber": 0,
        "data": ["col_6", "col_3", "col_7", "col 4", "col_9", "col_1"],
        "header": ["c6", "c3", undefined, "c4", undefined, "c1"]
      });
      done();
    }

  });

});


function collect(objects, verifyFunction, opts) {
  let dummyStream = mockReadStream();
  dummyStream.add(objects);

  let lines = [];

  let headerChecker = checkHeaderFactory(opts);
  dummyStream.pipe(headerChecker).on('data', function (line) {
      lines.push(line);
    })
    .on('error', function (err) {
      verifyFunction(err, lines);
    })
    .on('header', function (header) {
      //console.log(header);
    })
    .on('end', function () {
      verifyFunction(false, lines);
    });

}
