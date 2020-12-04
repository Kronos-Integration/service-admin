/*global require, describe, it*/
/* jslint node: true, esnext: true */
"use strict";

const should = require('chai').should();
const _ = require('underscore');

const moment = require('moment');
const checkDateFactory = require('../lib/recordCheck/data-check-date').createChecks;



const fieldDefinition = {
	"fieldType": {
		"type": "date",
		"minDate": "01.01.1970",
		"maxDate": "01.01.2011"
	},
	"severity": "abort_file",
	"defaultValue": "01.01.1980"
};

const fieldDefinitionComplex = {
	"fieldType": {
		"type": "date",
		"minDate": {
			"val": "01.01.1970",
			"severity": "skip_field"
		},
		"maxDate": {
			"val": "01.01.2011",
			"severity": "skip_record"
		}
	},
	"severity": "abort_file",
	"defaultValue": "01.01.1980"
};



const fieldName = "birthDate";
const content = {
	"gum": "val",
	"birthDate": "val"
};

const toBeChecked = [
	["15.12.2011", "15.12.2011 00:00:00"],
	["15.12.2011 00:03:00", "15.12.2011 00:03:00"],
	["15.12.2011 15:12:01 +00:00", "15.12.2011 15:12:01"],
	["15.12.2011 15:13:01Z", "15.12.2011 15:13:01"],
	["15.12.2011 00:00:00Z", "15.12.2011 00:00:00"],
	["15.12.2011 15:13:01 +03:00", "15.12.2011 12:13:01"],
	["15.12.2011 15:13:01 +3:00", "15.12.2011 12:13:01"],
	["15.12.2011 15:13:01+3:00", "15.12.2011 12:13:01"],
	["15.12.2011 15:13:01 -03:00", "15.12.2011 18:13:01"],
	["15.12.2011 15:13:01-03:00", "15.12.2011 18:13:01"],
	["15.12.2011 15:13:01 Z", "15.12.2011 15:13:01"],
	["15.12.2011T15:13:01 Z", "15.12.2011 15:13:01"],
	["15.12.11", "15.12.2011 00:00:00"],
	["15.12.11 00:03:00", "15.12.2011 00:03:00"],
	["15.12.11 15:12:01 +00:00", "15.12.2011 15:12:01"],
	["15.12.11 15:13:01Z", "15.12.2011 15:13:01"],

	["15.12.11 15:13:01 Z +3", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01 Z +3:0", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01 Z +3:00", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01 Z +03:00", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01Z+3", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01Z+3:0", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01Z+3:00", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01Z+03:00", "15.12.2011 12:13:01"],

	["15.12.11 15:13:01 gmt +3", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01 gmt +3:0", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01 gmt +3:00", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01 gmt +03:00", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01gmt+3", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01gmt+3:0", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01gmt+3:00", "15.12.2011 12:13:01"],
	["15.12.11 15:13:01gmt+03:00", "15.12.2011 12:13:01"],

	["15.12.70 15:13:01 +03:00", "15.12.1970 12:13:01"],
	["15.12.11 15:13:01 -03:00", "15.12.2011 18:13:01"],
	["15.12.90 15:13:01 Z", "15.12.1990 15:13:01"],
	["15.12.11T15:13:01 Z", "15.12.2011 15:13:01"],
	["15.12.2011 15:13", "15.12.2011 15:13:00"],
	["25.11.2014 12:04 GMT", "25.11.2014 12:04:00"],
	["12/1/2011", "01.12.2011 00:00:00"],
	["12/1/2011 00:03:00", "01.12.2011 00:03:00"],
	["1/15/2011 15:12:01 +00:00", "15.01.2011 15:12:01"],
	["1/15/2011 15:13:01Z", "15.01.2011 15:13:01"],
	["12/1/2011 15:13:01 +03:00", "01.12.2011 12:13:01"],
	["2/15/2011 15:13:01 -03:00", "15.02.2011 18:13:01"],
	["12/1/2011 15:13:01 Z", "01.12.2011 15:13:01"],
	["12/15/2011", "15.12.2011 00:00:00"],
	["12/15/2011 00:03:00", "15.12.2011 00:03:00"],
	["12/15/2011 15:12:01 +00:00", "15.12.2011 15:12:01"],
	["12/15/2011 15:13:01Z", "15.12.2011 15:13:01"],
	["12/15/2011 15:13:01 +03:00", "15.12.2011 12:13:01"],
	["12/15/2011 15:13:01 -03:00", "15.12.2011 18:13:01"],
	["12/15/2011 15:13:01 Z", "15.12.2011 15:13:01"],
	["12/15/2011 15:13:01-03:00", "15.12.2011 18:13:01"],
	["2011-12-15", "15.12.2011 00:00:00"],
	["2011-12-15 00:03:00", "15.12.2011 00:03:00"],
	["2011-12-15 15:12:01 +00:00", "15.12.2011 15:12:01"],
	["2011-02-31 00:00:00 -05:00", "01.01.1980 00:00:00"], // default Value
	["2011-02-99 01:12:01 -05:00", "01.01.1980 00:00:00"], // default Value
	["2011-03-31 23:00:00 -05:00", "01.04.2011 04:00:00"],
	["2011-03-31 23:00:00-05:00", "01.04.2011 04:00:00"],
	["2011-11-27 23:00:00  -05:00", "28.11.2011 04:00:00"],
	["20111127 23:00:00", "27.11.2011 23:00:00"],
	["20111127 15:00:00z", "27.11.2011 15:00:00"],
	["2011-11-27 15:00:00 uTc", "27.11.2011 15:00:00"],
	["2011-11-27 15.00.00 uTc", "27.11.2011 15:00:00"],
	["2011-11-27 23:00:00 -5:00", "28.11.2011 04:00:00"],
	["2011-11-27 23:00:00 -0500", "28.11.2011 04:00:00"],
	["2011-12-15 15:13:01Z", "15.12.2011 15:13:01"],
	["1970-01-01 00:00:00Z", "01.01.1970 00:00:00"],
	["2011-12-15 15:13:01 +03:00", "15.12.2011 12:13:01"],
	["2011-12-15 15:13:01 -03:00", "15.12.2011 18:13:01"],
	["2011-12-15 15:13:01 Z", "15.12.2011 15:13:01"],
	["2010-08-20 11:48:14 +01:00", "20.08.2010 10:48:14"],
	["2010-08-20 11:48:14+01:00", "20.08.2010 10:48:14"]
];


describe("data-check-date", function () {

	const dateChecks = checkDateFactory(fieldDefinition, fieldName);
	const dateChecksComplex = checkDateFactory(fieldDefinitionComplex, fieldName);


	it("Check that 3 checks where created for 'dateChecks'", function () {
		dateChecks.length.should.equal(3);
	});
	it("Check that 3 checks where created for 'dateChecksComplex'", function () {
		dateChecksComplex.length.should.equal(3);
	});


	it("parses dates correctly", function () {
		// iterate over all the checks
		toBeChecked.forEach(function (elem, i) {
			let cont = {
				"birthDate": elem[0]
			};
			const expected = elem[1];
			//const expected = moment.utc(elem[1], "DD.MM.YYYY HH:mm:ss +HH:mm").format("DD.MM.YYYY HH:mm:ss");

			// ignore min and max date checks here
			dateChecks[0](cont);

			const actual = moment.utc(cont.birthDate).format("DD.MM.YYYY HH:mm:ss");

			actual.should.equal(expected, "Error in line " + i + " For value '" + elem[0] + "'");

		});
	});

	it("does not return errors on correct dates", function () {
		let cont = {
			"birthDate": "15.12.2009"
		};

		dateChecks.forEach(function (elem, i) {
			const res = elem(cont);
			should.not.exist(res);
		});

	});

	it("returns erros for invalid dates", function () {
		let cont = {
			"birthDate": "gum date"
		};

		// execute the checks
		const res = dateChecks[0](cont);
		should.exist(res);
		res.errorCode.should.equal('NOT_DATE');
		res.severity.should.equal('abort_file');
	});

	it("date exeeds max date", function () {
		let cont = {
			"birthDate": "15.12.2011"
		};

		// It is a valid date
		let res = dateChecks[0](cont);
		should.not.exist(res);

		// min date is OK
		res = dateChecks[1](cont);
		should.not.exist(res);

		// max date is exeeded
		res = dateChecks[2](cont);
		should.exist(res);
		res.errorCode.should.equal('DATE_EXEEDS_MAX_DATE');
		res.severity.should.equal('abort_file');
	});

	it("date is below min date", function () {
		let cont = {
			"birthDate": "15.12.1969"
		};

		// It is a valid date
		let res = dateChecks[0](cont);
		should.not.exist(res);

		// min date is exeeded
		res = dateChecks[1](cont);
		should.exist(res);
		res.errorCode.should.equal('DATE_BEFORE_MIN_DATE');
		res.severity.should.equal('abort_file');

		// max date is OK
		res = dateChecks[2](cont);
		should.not.exist(res);
	});


	it("Check separate severity for minDate", function () {
		let cont = {
			"birthDate": "15.12.1969"
		};

		// It is a valid date
		let res = dateChecksComplex[0](cont);
		should.not.exist(res);

		// min date is exeeded
		res = dateChecksComplex[1](cont);
		should.exist(res);
		res.errorCode.should.equal('DATE_BEFORE_MIN_DATE');

		res.severity.should.equal('skip_field');

		// max date is OK
		res = dateChecksComplex[2](cont);
		should.not.exist(res);
	});

	it("Check separate severity for maxDate", function () {
		let cont = {
			"birthDate": "15.12.2011"
		};

		// It is a valid date
		let res = dateChecksComplex[0](cont);
		should.not.exist(res);

		// min date is OK
		res = dateChecksComplex[1](cont);
		should.not.exist(res);

		// max date is exeeded
		res = dateChecksComplex[2](cont);
		should.exist(res);
		res.errorCode.should.equal('DATE_EXEEDS_MAX_DATE');
		res.severity.should.equal('skip_record');
	});


});
