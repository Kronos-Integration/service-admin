/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const fs = require('fs');
const read = fs.createReadStream;
const path = require('path');
const eol = require('os').EOL;

const lp = require('../src/line-parser');

describe('stream-line-parser: split in lines', function () {

	it('big file', function (done) {
		collect('big_file.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);

			assert.equal(lines.length, 49);

			assert.deepEqual(lines[19], {
				"lineNumber": 19,
				"data": "4711-1;1986856389;antoine-pierre.jenina@db.com;antoine-pierre;jenina;25.09.2014 13:04:32;personal;antoine-pierre.jenina@db.com;[5176] - Resource ADND /->/ 7zX.app|[5022] - Resource F505 /->/ Apple_Configurator.app"
			});

			assert.deepEqual(lines[43], {
				"lineNumber": 43,
				"data": "4711-1;1986856389;antoine-pierre.jenina@db.com;antoine-pierre;jenina;25.09.2014 13:04:32;personal;antoine-pierre.jenina@db.com;[5176] - Resource ADND /->/ 7zX.app|[5022] - Resource F505 /->/ Apple_Configurator.app"
			});

			done();
		}
	});


	it('empty lines skiped', function (done) {
		collect('empty_lines.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 2,
				"data": "as,ä,wd"
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 5,
				"data": "ll,ö,sde"
			});
			done();
		}
	});

	it('empty lines NOT skiped', function (done) {
		collect('empty_lines.csv', {
			"skip_empty_lines": false
		}, verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": ""
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "as,ä,wd"
			});
			assert.deepEqual(lines[3], {
				"lineNumber": 3,
				"data": ""
			});
			assert.deepEqual(lines[4], {
				"lineNumber": 4,
				"data": ""
			});
			assert.deepEqual(lines[5], {
				"lineNumber": 5,
				"data": "ll,ö,sde"
			});
			done();
		}
	});


	it('line break with custom quotes', function (done) {
		collect('linebreak_in_custom_quotes.csv', {
			"quote_char": "'",
			"allow_new_line_in_cell": true
		}, verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": "'a1" + eol + "a2',bbbb,cccc"
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "d,e,f"
			});
			done();
		}
	});

	it('line break with custom quotes BUT NO line breaks in cells', function (done) {
		collect('linebreak_in_custom_quotes.csv', {
			"quote_char": "'"
		}, verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": "'a1"
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "a2',bbbb,cccc"
			});
			assert.deepEqual(lines[3], {
				"lineNumber": 3,
				"data": "d,e,f"
			});
			done();
		}
	});

	it('line break in quotes', function (done) {
		collect('linebreak_in_quotes.csv', {
				"allow_new_line_in_cell": true
			},
			verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": '"a1' + eol + 'a2",bbbb,cccc'
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "d,e,f"
			});
			done();
		}
	});

	it('line break in quotes BUT NO line breaks in cells', function (done) {
		collect('linebreak_in_quotes.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": '"a1'
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": 'a2",bbbb,cccc'
			});
			assert.deepEqual(lines[3], {
				"lineNumber": 3,
				"data": "d,e,f"
			});
			done();
		}
	});

	it('only one line', function (done) {
		collect('only_one_line.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			done();
		}
	});

	it('only one char', function (done) {
		collect('only_one_char.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": "b"
			});
			done();
		}
	});


	it('simple file NL', function (done) {
		collect('simple_file.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": "as,ä,wd"
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "ll,ö,sde"
			});
			done();
		}
	});

	it('simple file CR', function (done) {
		collect('simple_file.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": "as,ä,wd"
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "ll,ö,sde"
			});
			done();
		}
	});

	it('simple file CR NL', function (done) {
		collect('simple_file.csv', verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": "as,ä,wd"
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "ll,ö,sde"
			});
			done();
		}
	});

	it('simple file own line break char', function (done) {
		collect('simple_file_own_delimiter.csv', {
			"line_separator": "|"
		}, verify);

		function verify(err, lines) {
			assert.notOk(err);
			assert.deepEqual(lines[0], {
				"lineNumber": 0,
				"data": "a,b,c"
			});
			assert.deepEqual(lines[1], {
				"lineNumber": 1,
				"data": "as,ä,wd"
			});
			assert.deepEqual(lines[2], {
				"lineNumber": 2,
				"data": "ll,ö,sde" + eol
			});
			done();
		}
	});

});


/**
 * Returns the path to the given test file name.
 */
function fixture(name) {
	return path.join(__dirname, 'fixtures', name);
}

function collect(file, opts, cb) {
	if (typeof opts === 'function') return collect(file, null, opts);
	var data = read(fixture(file));
	var lines = [];
	var parser = lp(opts);
	data.pipe(parser)
		.on('data', function (line) {
			lines.push(line);
		})
		.on('error', function (err) {
			cb(err, lines);
		})
		.on('end', function () {
			cb(false, lines);
		});
	return parser;
}
