/* global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

var assert = require('chai').assert;

const ZSchema = require("z-schema");
const validator = new ZSchema({});
const schema = require("../schema/header.json");

describe('stream-line-header: schema header', function () {
	it('Valid header all', function () {
		let valid = validator.validate({
				"expectedHeader": ["gum", "bo", ["hu", "go"]],
				"fieldNames": ["gum", "bo", "go"],
				"caseSensitive": true,
				"strict": {
					"val": false,
					"severity": true
				},
				"additionalColumns": false,
				"missingColumns": true,
				"mandatoryColumns": ["gum"],
				"severity": "abort_file"
			},
			schema);

		let errors = validator.getLastErrors();
		assert(errors === undefined);
	});

	it('Valid header all with different severity', function () {
		let valid = validator.validate({
				"expectedHeader": ["gum", "bo", ["hu", "go"]],
				"fieldNames": ["gum", "bo", "go"],
				"caseSensitive": true,
				"strict": {
					"val": false,
					"severity": "abort_file"
				},
				"additionalColumns": false,
				"missingColumns": true,
				"mandatoryColumns": {
					"val": ["gum"],
					"severity": "abort_scope"
				},
				"severity": "abort_file"
			},
			schema);

		let errors = validator.getLastErrors();
		assert(errors === undefined);
	});

	it('Invalid: Unexpected property', function () {
		let valid = validator.validate({
				"expectedHeader": ["gum", "bo", ["hu", "go"]],
				"fieldNames": ["gum", "bo", "go"],
				"caseSensitive": true,
				"strict": {
					"val": false,
					"severity": "abort_file"
				},
				"additionalColumns": false,
				"missingColumns": true,
				"mandatoryColumns": {
					"val": ["gum"],
					"severity": "abort_scope"
				},
				"severity": "abort_file",
				"GUM": 3
			},
			schema);

		let errors = validator.getLastErrors();
		assert(errors !== undefined);

		let err = errors.shift();
		assert(err.code === 'OBJECT_ADDITIONAL_PROPERTIES');
		assert(err.path === '#/');

	});

	it('Invalid: header property wrong type, must be array', function () {
		let valid = validator.validate({
				"expectedHeader": ["gum", "bo", ["hu", "go"]],
				"fieldNames": "GUM",
				"caseSensitive": true,
				"strict": {
					"val": false,
					"severity": "abort_file"
				},
				"additionalColumns": false,
				"missingColumns": true,
				"mandatoryColumns": {
					"val": ["gum"],
					"severity": "abort_scope"
				},
				"severity": "abort_file",
			},
			schema);

		let errors = validator.getLastErrors();
		assert(errors !== undefined);
		let err = errors.shift();
		assert(err.code === 'INVALID_TYPE');
		assert(err.path === '#/fieldNames');

	});

	it('Invalid: missing property = additionalColumns', function () {
		let valid = validator.validate({
				"expectedHeader": ["gum", "bo", ["hu", "go"]],
				"fieldNames": "GUM",
				"caseSensitive": true,
				"strict": {
					"val": false,
					"severity": "abort_file"
				},
				"missingColumns": true,
				"mandatoryColumns": {
					"val": ["gum"],
					"severity": "abort_scope"
				},
				"severity": "abort_file",
			},
			schema);

		let errors = validator.getLastErrors();
		assert(errors !== undefined);

		let err = errors.shift();
		assert(err.code === 'OBJECT_MISSING_REQUIRED_PROPERTY');
		assert(err.path === '#/');

	});
});
