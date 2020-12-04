/*global require, describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const should = require('chai').should();
const _ = require('underscore');

const fieldSplitterFactory = require('../lib/converter/data-field-splitter').createChecks;


const checkProperty = {
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
		"escapeChar": "\\",
		"sortFields": true,
		"uniqueFields": true,
		"removeWhiteSpace": true,
		"removeEmpty": true
	}
};


// The meta info for the check
const checkPropertyUpdate = {
	"array_1": {
		"delimiter": ",",
		"escapeChar": "\\",
		"sortFields": true,
		"uniqueFields": true,
		"removeWhiteSpace": true,
		"removeEmpty": true
	},
	"array_2": {
		"delimiter": ",",
		"escapeChar": "\\",
		"sortFields": false,
		"uniqueFields": true,
		"removeWhiteSpace": true,
		"removeEmpty": true
	},
	"array_3": {
		"delimiter": ",",
		"escapeChar": "\\",
		"sortFields": true,
		"uniqueFields": false,
		"removeWhiteSpace": true,
		"removeEmpty": true
	},
	"array_4": {
		"delimiter": ",",
		"escapeChar": "\\",
		"sortFields": true,
		"uniqueFields": true,
		"removeWhiteSpace": false,
		"removeEmpty": true
	},
	"array_5": {
		"delimiter": ",",
		"escapeChar": "\\",
		"sortFields": true,
		"uniqueFields": true,
		"removeWhiteSpace": true,
		"removeEmpty": false
	}
};

const content = {
	"array_1": "a,,f,b,,,, ,   , c\\,s , z,  d ,d, e,,,e,uuu",
	"array_2": "a,,f,b,,,, ,   , c\\,s , z,  d ,d, e,,,e,uuu",
	"array_3": "a,,f,b,,,, ,   , c\\,s , z,  d ,d, e,,,e,uuu",
	"array_4": "a,,f,b,,,, ,   , c\\,s , z,  d ,d, e,,,e,uuu",
	"array_5": "a,,f,b,,,, ,   , c\\,s , z,  d ,d, e,,,e,uuu"
};

const expected = {
	"array_1": "a;b;c,s;d;e;f;uuu;z",
	"array_2": "a;f;b;c,s;z;d;e;uuu",
	"array_3": "a;b;c,s;d;d;e;e;f;uuu;z",
	"array_4": " ;   ;  d ; c,s ; e; z;a;b;d;e;f;uuu",
	"array_5": ";a;b;c,s;d;e;f;uuu;z"
};


describe("field splitter", function () {
	it("Split fields and clean all the values: array_1", function () {
		const caseName = "array_1";
		const cp = _.clone(checkProperty);
		cp.multiField = checkPropertyUpdate[caseName];
		const check = fieldSplitterFactory(cp, caseName);
		should.exist(check);

		let error = check(content);
		should.not.exist(error);
		content[caseName].join(";").should.equal(expected[caseName]);
	});

	it("Split fields but do not sort: array_2", function () {
		const caseName = "array_2";
		const cp = _.clone(checkProperty);
		cp.multiField = checkPropertyUpdate[caseName];
		const check = fieldSplitterFactory(cp, caseName);
		should.exist(check);

		let error = check(content);
		should.not.exist(error);
		content[caseName].join(";").should.equal(expected[caseName]);
	});

	it("Split fields but do not remove duplicates: array_3", function () {
		const caseName = "array_3";
		const cp = _.clone(checkProperty);
		cp.multiField = checkPropertyUpdate[caseName];
		const check = fieldSplitterFactory(cp, caseName);
		should.exist(check);

		let error = check(content);
		should.not.exist(error);
		content[caseName].join(";").should.equal(expected[caseName]);
	});

	it("Split fields but do not remove whiteSpaces: array_4", function () {
		const caseName = "array_4";
		const cp = _.clone(checkProperty);
		cp.multiField = checkPropertyUpdate[caseName];
		const check = fieldSplitterFactory(cp, caseName);
		should.exist(check);

		let error = check(content);
		should.not.exist(error);
		content[caseName].join(";").should.equal(expected[caseName]);
	});

	it("Split fields but do not remove empty: array_5", function () {
		const caseName = "array_5";
		const cp = _.clone(checkProperty);
		cp.multiField = checkPropertyUpdate[caseName];
		const check = fieldSplitterFactory(cp, caseName);
		should.exist(check);

		let error = check(content);
		should.not.exist(error);
		content[caseName].join(";").should.equal(expected[caseName]);
	});

});
