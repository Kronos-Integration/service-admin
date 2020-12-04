const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const messageFactory = require('../dist/message');

describe("Message", function () {

	it('create empty message', function (done) {
		const msg = messageFactory.createMessage();
		assert.deepEqual(msg, {
			"info": {},
			"hops": [],
			"payload": {}
		});

		done();
	});

	it('create message with header', function (done) {

		const msg = messageFactory.createMessage({
			"info": {
				"my": "name"
			}
		});

		assert.deepEqual(msg, {
			"info": {
				"my": "name"
			},
			"hops": [],
			"payload": {}
		});

		done();
	});

	it('create message from existing message: overwrite', function (done) {
		const msg = messageFactory.createMessage({
			"info": {
				"my": "name"
			}
		});

		const msgNew = messageFactory.createMessage({
			"info": {
				"my": "lastName"
			}
		}, msg);

		assert.deepEqual(msgNew, {
			"info": {
				"my": "name"
			},
			"hops": [],
			"payload": {}
		});

		done();
	});

	it('create message from existing message: merge', function (done) {
		const msg = messageFactory.createMessage({
			"info": {
				"my": "name"
			}
		});

		const msgNew = messageFactory.createMessage({
			"info": {
				"mylast": "lastName"
			}
		}, msg);

		assert.deepEqual(msgNew, {
			"info": {
				"my": "name",
				"mylast": "lastName"
			},
			"hops": [],
			"payload": {}
		});

		done();
	});

});
