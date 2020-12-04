/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const mockReadStream = require('kronos-test-interceptor').mockReadStreamFactory;

const lt = require('../dist/module').parserFactory;

describe('stream-line-tokenizer-csv: tokenize lines', function () {

	it('simple test', function (done) {

		let obj = {
			"lineNumber": 0,
			"data": "This,is, a , normal ,delimited  line  , to , be splitted"
		};

		collect(obj, verify);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['This', 'is', 'a', 'normal', 'delimited  line', 'to', 'be splitted']
			});

			done();
		}
	});

	it('First separator in Quotes', function (done) {

		let obj = {
			"lineNumber": 0,
			"data": '"Gum;Bo",  Last Name, First Name;other'
		};

		collect(obj, verify);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['Gum;Bo', 'Last Name', 'First Name;other']
			});

			done();
		}
	});

	it('First separator in Quotes without using quotes', function (done) {

		let obj = {
			"lineNumber": 0,
			"data": '"Gum;Bo",  Last Name, First Name;other'
		};

		collect(obj, verify, {
			"use_quotes": false
		});

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['"Gum', 'Bo",  Last Name, First Name', 'other']
			});

			done();
		}
	});

	it('Trimm, but do not trim quoted string', function (done) {

		let obj = {
			"lineNumber": 0,
			"data": '"  Gum;Bo ",  Last Name  , First Name;other'
		};

		collect(obj, verify);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['  Gum;Bo ', 'Last Name', 'First Name;other']
			});

			done();
		}
	});

	it('Double quotes in quoted and unquoted field', function (done) {

		let obj = {
			"lineNumber": 0,
			"data": '"  Gum""Bo ",  Last""Name  , First Name;other'
		};

		collect(obj, verify);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['  Gum"Bo ', 'Last"Name', 'First Name;other']
			});

			done();
		}
	});

	it('Take Separator from Header Line', function (done) {

		let obj = [{
			"lineNumber": 0,
			"data": 'Name;Last Name;Email'
		}, {
			"lineNumber": 1,
			"data": 'Hugo,master;Bats;urbi@orbi.de'
		}];

		collect(obj, verify);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 2);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['Name', 'Last Name', 'Email']
			});

			assert.deepEqual(objects[1], {
				"lineNumber": 1,
				"data": ['Hugo,master', 'Bats', 'urbi@orbi.de']
			});

			done();
		}
	});

	it('First field empty', function (done) {

		let obj = [{
			"lineNumber": 0,
			"data": ';Last Name;Email'
		}];

		collect(obj, verify);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['', 'Last Name', 'Email']
			});

			done();
		}
	});

	it('All fields empty', function (done) {

		let obj = [{
			"lineNumber": 0,
			"data": ';;;'
		}];

		collect(obj, verify);

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ['', '', '']
			});

			done();
		}
	});

	it('Use Custom quotes', function (done) {

		let obj = {
			"lineNumber": 0,
			"data": "'  ;Gum''Bo ',  Last''Name  , First Name;other'"
		};

		collect(obj, verify, {
			"quote_char": "'"
		});

		function verify(err, objects) {
			assert.notOk(err);

			assert.equal(objects.length, 1);

			assert.deepEqual(objects[0], {
				"lineNumber": 0,
				"data": ["  ;Gum'Bo ", "Last'Name", "First Name;other'"]
			});

			done();
		}
	});


});


function collect(objects, verifyFunction, opts) {
	let dummyStream = mockReadStream();
	dummyStream.add(objects);

	let lines = [];

	let tokenizer = lt(opts);
	dummyStream.pipe(tokenizer).on('data', function (line) {
			lines.push(line);
		})
		.on('error', function (err) {
			verifyFunction(err, lines);
		})
		.on('end', function () {
			verifyFunction(false, lines);
		});
}
