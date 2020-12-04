/*global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

var _ = require('underscore');
const mockReadStream = require('kronos-test-interceptor').mockReadStreamFactory;

const dataProcessor = require('../lib/data-processor-row.js');


describe("data-processor-row: boolean", function () {

	it('Value is missing and mandatory = true', function (done) {
		let options = {
			"technical": {
				"fieldType": "boolean",
				"mandatory": true,
				"severity": "skip_field"
			},
		};

		let data = {
			"lineNumber": 1,
			"data": {
				"_technical": "y",
				"other": "any"
			}
		};

		collect(data, verify, options);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 1,
				"data": {
					"_technical": "y",
					"other": "any"
				},
				"errors": [{
					"errorCode": "MANDATORY_VALUE_MISSING",
					"fieldName": "technical",
					"severity": "skip_field"
				}]
			});
			done();
		}
	});


	it('Value is missing and mandatory = true but severity for mandatory check is different ', function (done) {
		let options = {
			"technical": {
				"fieldType": "boolean",
				"mandatory": {
					"val": true,
					"severity": "skip_record"
				},
				"severity": "skip_field"
			},
		};

		let data = {
			"lineNumber": 1,
			"data": {
				"_technical": "y",
				"other": "any"
			}
		};

		collect(data, verify, options);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 1,
				"data": {
					"_technical": "y",
					"other": "any"
				},
				"errors": [{
					"errorCode": "MANDATORY_VALUE_MISSING",
					"fieldName": "technical",
					"severity": "skip_record"
				}]
			});
			done();
		}
	});

	it('Value is missing and no default is defined', function (done) {
		let options = {
			"technical": {
				"fieldType": "boolean",
				"mandatory": false
			},
		};

		let data = {
			"lineNumber": 1,
			"data": {
				"_technical": "y",
				"other": "any"
			}
		};

		collect(data, verify, options);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 1,
				"data": {
					"_technical": "y",
					"other": "any"
				}
			});
			done();
		}
	});


	it('Convert a true-ish value', function (done) {
		let options = {
			"technical": {
				"fieldType": "boolean",
				"mandatory": false,
				"defaultValue": false
			},
		};

		let data = {
			"lineNumber": 1,
			"data": {
				"technical": "y",
				"other": "any"
			}
		};

		collect(data, verify, options);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 1,
				"data": {
					"technical": true,
					"other": "any"
				}
			});
			done();
		}
	});

	it('Convert a false-ish value', function (done) {
		let options = {
			"technical": {
				"fieldType": "boolean",
				"mandatory": false,
				"defaultValue": false
			},
		};

		let data = {
			"lineNumber": 1,
			"data": {
				"technical": "no",
				"other": "any"
			}
		};

		collect(data, verify, options);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 1,
				"data": {
					"technical": false,
					"other": "any"
				}
			});
			done();
		}
	});

	it('Use default, value is not valid', function (done) {
		let options = {
			"technical": {
				"fieldType": "boolean",
				"mandatory": false,
				"defaultValue": false
			},
		};

		let data = {
			"lineNumber": 1,
			"data": {
				"technical": "gum",
				"other": "any"
			}
		};

		collect(data, verify, options);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 1,
				"data": {
					"technical": false,
					"other": "any"
				},
				"errors": [{
					"errorCode": "NOT_BOOLEAN",
					"fieldName": "technical",
					"severity": undefined,
					"value": "gum"
				}]
			});
			done();
		}
	});

	it('Use default, value is missing', function (done) {
		let options = {
			"technical": {
				"fieldType": "boolean",
				"mandatory": false,
				"defaultValue": false
			},
		};

		let data = {
			"lineNumber": 1,
			"data": {
				"_technical": "no",
				"other": "any"
			}
		};

		collect(data, verify, options);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 1,
				"data": {
					"_technical": "no",
					"technical": false,
					"other": "any"
				}
			});
			done();
		}
	});


});



function collect(objects, verifyFunction, opts) {
	let dummyStream = mockReadStream();
	dummyStream.add(objects);

	let lines = [];

	let dp = dataProcessor(opts);
	dummyStream.pipe(dp).on('data', function (line) {
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
