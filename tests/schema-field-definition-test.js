/* global describe, it*/
/* jslint node: true, esnext: true */
"use strict";

var assert = require('chai').assert;

const ZSchema = require("z-schema");
const validator = new ZSchema({});
const schema = require("../schema/field_definition.json");

describe('field_definition', function () {
	it('Valid field_definition string multiField', function () {
		let valid = validator.validate({
				"fieldType": {
					"type": "string",
					"fieldCase": "upper",
					"minLength": {
						"val": 10,
						"severity": "abort_file"
					},
					"maxLength": 20,
				},
				"defaultValue": "my default",
				"mandatory": true,
				"severity": "abort_file",
				"multiField": {
					"delimiter": ",",
					"escapeChar": "\\"
				}
			},
			schema);

		let errors = validator.getLastErrors();
		assert(errors === undefined);
	});

});
