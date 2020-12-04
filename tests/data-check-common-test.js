/*global require, describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();
const _ = require('underscore');

const checkCommonFactory = require('../lib/recordCheck/data-check-common').createChecks;


const fieldDefinition = {
	"fieldType": {
		"type": "boolean",
	},
	"defaultValue": "false",
	"mandatory": true,
	"severity": "abort_file"
};

const content = {
	"gum": "val",
	"boolField": "val"
};


describe("data-check-common: get severity from the check", function () {

	it("Severity from the check definition", function () {

		const fieldDefinitionLocal = {
			"fieldType": {
				"type": "boolean",
			},
			"defaultValue": "false",
			"mandatory": {
				"val": true,
				"severity": "skip_record"
			},
			"severity": "abort_file"
		};

		const check = checkCommonFactory(fieldDefinitionLocal, "boolField_NOT");

		let error = check(content);
		should.exist(error);

		assert.deepEqual(error, {
			"errorCode": "MANDATORY_VALUE_MISSING",
			"fieldName": "boolField_NOT",
			"severity": "skip_record"
		});
	});



});


describe("data-check-common", function () {
	it("A mandatory value is missing", function () {
		let fieldName = "gumbo";
		const check = checkCommonFactory(fieldDefinition, fieldName);
		should.exist(check);
		let error = check(content);
		should.exist(error);
		error.errorCode.should.equal("MANDATORY_VALUE_MISSING");
	});

	it("A mandatory value exists", function () {
		let fieldName = "gum";
		const check = checkCommonFactory(fieldDefinition, fieldName);
		should.exist(check);
		let error = check(content);
		should.not.exist(error);
	});


});
