/*global describe, it*/
/* jslint node: true, esnext: true */
"use strict";
const should = require('chai').should();
var _ = require('underscore');

const createNumberCheckFactory = require('../lib/recordCheck/data-check-number').createChecks;

// The cont to be checked by the file check
var content = {
	"num_1": "201.12.12,34",
	"num_2": "2.011.212,23",
	"age_1": "5",
	"age_2": "9,34",
	"age_3": "9,341",
	"val_1": "1.5",
	"val_2": "1.29999",
	"tax_1": "19,23",
	"tax_2": "19.23",
	"value_space": "35 ",
	"value_alpha": "35ws",
	"null_string": null,
	"empty_string": ""
};

describe("file-check-number", function () {

	it("check valid float with dot and comma", function () {
		let fieldName = "num_2";

		let fieldDefinition = {
			"fieldType": {
				"type": "float",
				"min": 1.3,
				//	"max": 9.34,
				"decimalSeparator": ","
			},
			"severity": "abort_file",
			"defaultValue": "815.0"
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});

		errors.length.should.equal(0);
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(2011212.23);
	});

	it("check invalid float because of wrong decimal separator. Value changed to default value", function () {
		let fieldName = "num_1";

		let fieldDefinition = {
			"fieldType": {
				"type": "float",
				"min": 1.3,
				"max": 9.34,
				"decimalSeparator": "."
			},
			"severity": "abort_file",
			"defaultValue": "8.03"
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});

		errors.length.should.equal(1);
		errors[0].errorCode.should.equal("NUMBER_NOT_VALID");
		should.exist(cont[fieldName]);
		// should contain default value
		cont[fieldName].should.equal(8.03);
	});


	it("check valid float exeeds max value. Change value to default value", function () {
		let fieldName = "num_1";

		let fieldDefinition = {
			"fieldType": {
				"type": "float",
				"min": 1.3,
				"max": 9.34,
				"decimalSeparator": ","
			},
			"severity": "abort_file",
			"defaultValue": "815,0"
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});
		errors.length.should.equal(1);
		errors[0].errorCode.should.equal("NUMBER_GREATER_THEN_MAX_VALUE");
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(815.0);
	});

	it("check valid float below min value. Change value to default value", function () {
		let fieldName = "val_2";

		let fieldDefinition = {
			"fieldType": {
				"type": "float",
				"min": 1.3,
				"max": 9.34,
				"decimalSeparator": "."
			},
			"severity": "abort_file",
			"defaultValue": "8.53"
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});
		errors.length.should.equal(1);
		errors[0].errorCode.should.equal("NUMBER_LESS_THEN_MIN_VALUE");
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(8.53);
	});

	it("check valid integer", function () {
		let fieldName = "age_1";

		let fieldDefinition = {
			"fieldType": {
				"type": "integer",
				"min": 2,
				"max": 9,
				"decimalSeparator": "."
			},
			"severity": "abort_file",
			"defaultValue": 815
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});

		errors.length.should.equal(0);
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(5);
	});

	it("check valid integer exeeds max value. Changed to default value", function () {
		let fieldName = "age_1";

		let fieldDefinition = {
			"fieldType": {
				"type": "integer",
				"min": 2,
				"max": 4
			},
			"severity": "abort_file",
			"defaultValue": 3
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});

		errors.length.should.equal(1);
		errors[0].errorCode.should.equal("NUMBER_GREATER_THEN_MAX_VALUE");
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(3);
	});

	it("check invalid integer. Value contains space", function () {
		let fieldName = "value_space";

		let fieldDefinition = {
			"fieldType": {
				"type": "integer",
				"min": 2,
				"max": 50
			},
			"severity": "abort_file",
			"defaultValue": 7
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});
		errors.length.should.equal(1);
		errors[0].errorCode.should.equal("NUMBER_NOT_VALID");
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(7);
	});

	it("check invalid integer. Value contains space", function () {
		let fieldName = "value_space";

		let fieldDefinition = {
			"fieldType": {
				"type": "integer",
				"min": 2,
				"max": 50
			},
			"severity": "abort_file",
			"defaultValue": 7
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});
		errors.length.should.equal(1);
		errors[0].errorCode.should.equal("NUMBER_NOT_VALID");
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(7);
	});


	it("check invalid integer. Float was given. Default value set", function () {
		let fieldName = "val_1";

		let fieldDefinition = {
			"fieldType": {
				"type": "integer",
				"min": 1,
				"max": 9
			},
			"severity": "abort_file",
			"defaultValue": 5
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});
		errors.length.should.equal(1);
		errors[0].errorCode.should.equal("NOT_INTEGER");
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(5);
	});

	it("Null value is set to default", function () {
		let fieldName = "gumbo";

		let fieldDefinition = {
			"fieldType": {
				"type": "integer",
				"min": 1,
				"max": 9
			},
			"severity": "abort_file",
			"defaultValue": 5
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});
		errors.length.should.equal(0);
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(5);
	});

	it("Empty string value is set to default", function () {
		let fieldName = "gumbo";

		let fieldDefinition = {
			"fieldType": {
				"type": "integer",
				"min": 1,
				"max": 9
			},
			"severity": "abort_file",
			"defaultValue": 5
		};

		let checks = createNumberCheckFactory(fieldDefinition, fieldName);

		// create a clone of the original content, because it may be changed in the check function
		let cont = _.clone(content);
		cont.gumbo = "";

		let errors = [];
		checks.forEach(function (check) {
			let error = check(cont);
			if (error) {
				errors.push(error);
			}
		});
		errors.length.should.equal(0);
		should.exist(cont[fieldName]);
		cont[fieldName].should.equal(5);
	});

});
