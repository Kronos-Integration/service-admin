/*global require, describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const _ = require('underscore');

const checkBooleanFactory = require('../lib/recordCheck/data-check-boolean').createChecks;


const fieldDefinition = {
	"fieldType": {
		"type": "boolean",
	},
	"defaultValue": "false",
	"mandatory": true,
	"severity": "abort_file"
};

const trueValues = ["Y", "y", "J", "j", "T", "t", "JA", "ja", "TRUE", "true", "YES", "yes", "1", "S", "s", "SI", "si",
	1
];
const falseValues = ["N", "n", "F", "f", "NEIN", "nein", "FALSE", "false", "NO", "no", "0", 0];
const illegalValuesEmpty = [null, undefined];
const illegalValues = [1.3, 0.4, "JAJA", "NONO", "", "   "];

const fieldName = "boolField";

const mixedValues = ["Y", "", "gum", undefined, null, "F", false, true];
const mixedValuesexpected = [true, false, false, false, false, false, false, true];


const content = {
	"gum": "val",
	"boolField": "val"
};

describe("data-check-boolean: get severity and field type", function () {

	it("Severity from the field definition", function () {

		let fieldDefinitionLocal = {
			"fieldType": "boolean",
			"defaultValue": "false",
			"severity": "abort_file"
		};

		const check = checkBooleanFactory(fieldDefinitionLocal, "boolField");
		content.boolField = 'dd';

		let error = check(content);
		should.exist(error);

		assert.deepEqual(error, {
			"errorCode": "NOT_BOOLEAN",
			"fieldName": "boolField",
			"severity": "abort_file",
			"value": "dd"
		});
	});

	it("Severity from the boolean check", function () {

		let fieldDefinitionLocal = {
			"fieldType": {
				"type": "boolean",
				"severity": "skip_record"
			},
			"defaultValue": "false",
			"severity": "abort_file"
		};

		const check = checkBooleanFactory(fieldDefinitionLocal, "boolField");
		content.boolField = 'dd';

		let error = check(content);
		should.exist(error);

		assert.deepEqual(error, {
			"errorCode": "NOT_BOOLEAN",
			"fieldName": "boolField",
			"severity": "skip_record",
			"value": "dd"
		});
	});


});

describe("data-check-boolean ARRAY", function () {
	it("converts true-ish values to true", function () {
		const check = checkBooleanFactory(fieldDefinition, fieldName);
		content[fieldName] = trueValues;
		let error = check(content);
		should.not.exist(error);

		content[fieldName].length.should.equal(18);
		content[fieldName].forEach(function (val) {
			val.should.equal(true);
		});
	});
	it("converts false-ish values to false", function () {
		const check = checkBooleanFactory(fieldDefinition, fieldName);
		content[fieldName] = falseValues;
		let error = check(content);
		should.not.exist(error);

		content[fieldName].length.should.equal(12);
		content[fieldName].forEach(function (val) {
			val.should.equal(false);
		});
	});

	it("converts array of valid and invalid values", function () {
		const check = checkBooleanFactory(fieldDefinition, fieldName);
		content[fieldName] = mixedValues;
		let errors = check(content);
		should.exist(errors);

		content[fieldName].length.should.equal(8);
		content[fieldName].forEach(function (val, idx) {
			val.should.equal(mixedValuesexpected[idx]);
		});
	});


});

describe("data-check-boolean", function () {
	it("converts true-ish values to true", function () {
		const check = checkBooleanFactory(fieldDefinition, fieldName);
		should.exist(check);
		trueValues.forEach(function (item) {
			content[fieldName] = item;
			let error = check(content);
			should.not.exist(error);

			content[fieldName].should.equal(true);
		});
	});

	it("converts false-ish values to false", function () {
		const check = checkBooleanFactory(fieldDefinition, fieldName);
		should.exist(check);
		falseValues.forEach(function (item) {
			content[fieldName] = item;
			let error = check(content);
			should.not.exist(error);

			content[fieldName].should.equal(false);
		});
	});

	it("converts illegal values which are not empty ones to the default value", function () {
		const check = checkBooleanFactory(fieldDefinition, fieldName);
		should.exist(check);
		illegalValues.forEach(function (item) {
			content[fieldName] = item;
			let error = check(content);
			should.exist(error);
			error.errorCode.should.equal('NOT_BOOLEAN');
			content[fieldName].should.equal(false);
		});
	});

	it("converts illegal values which are empty ones to the default value", function () {
		const check = checkBooleanFactory(fieldDefinition, fieldName);
		should.exist(check);
		illegalValuesEmpty.forEach(function (item) {
			content[fieldName] = item;
			let error = check(content);
			should.not.exist(error);
			content[fieldName].should.equal(false);
		});
	});

});
