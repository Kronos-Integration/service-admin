
/**
 * This module will turn an array of tokens into an object.
 */

const stream = require('stream');

const ZSchema = require('z-schema');
const validator = new ZSchema({});

const schema = require('../schema/row_processor_definition.json');
validator.setRemoteReference('field_definition#', require('../schema/field_definition.json'));


const fieldSplitter = require('./converter/data-field-splitter.js');
const checkBoolean = require('./recordCheck/data-check-boolean.js');
const checkCommon = require('./recordCheck/data-check-common.js');
const checkDate = require('./recordCheck/data-check-date.js');
const checkNumber = require('./recordCheck/data-check-number.js');
const checkStringEmail = require('./recordCheck/data-check-string-email.js');

class DataProcessorRow extends stream.Transform {

	/**
	 *
	 * @oaram opts The field definitions as decribed by the schema
	 * @validate if is true, then the given options will be validated by the schema
	 */
	constructor(opts, validate) {
		// call the constructor of stream.Transform
		super({
			objectMode: true,
			highWaterMark: 16
		});

		if (!opts) opts = {};

		if (validate) {
			// first check if the checkProperty is valid
			const valid = validator.validate(opts, schema);
			const validationErrors = validator.getLastErrors();

			if (validationErrors) {
				console.log(validationErrors);
				// There where validation errors
				throw (validationErrors);
			}

		}

		// Stores all the checks to be executed
		this.checks = [];

		for (let fieldName in opts) {
			if (opts.hasOwnProperty(fieldName)) {
				let fieldDefinition = opts[fieldName];

				this.addChecks(fieldSplitter.createChecks(fieldDefinition, fieldName));
				this.addChecks(checkBoolean.createChecks(fieldDefinition, fieldName));
				this.addChecks(checkCommon.createChecks(fieldDefinition, fieldName));
				this.addChecks(checkDate.createChecks(fieldDefinition, fieldName));
				this.addChecks(checkNumber.createChecks(fieldDefinition, fieldName));
				this.addChecks(checkStringEmail.createChecks(fieldDefinition, fieldName));
			}
		}
	}

	/**
	 * Add checks to the array of checks to be executed
	 */
	addChecks(checks) {
		if (checks) {
			if (Array.isArray(checks)) {
				for (let i = 0; i < checks.length; i++) {
					this.checks.push(checks[i]);
				}
			} else {
				this.checks.push(checks);
			}
		}
	}

	/**
	 * Reads the stream data and split it into lines.
	 */
	_transform(data, enc, cb) {
			if (data.lineNumber === 0) {
				if (data.header) {
					// The first element is a header. Skip it
					cb(data);
				}
			}

			let objData = data.data;

			for (let i = 0; i < this.checks.length; i++) {
				let errors = this.checks[i](objData);

				if (errors) {
					if (!data.errors) {
						// create an empty error array
						data.errors = [];
					}

					if (Array.isArray(errors)) {
						for (let i = 0; i < errors.length; i++) {
							data.errors.push(errors[i]);
						}
					} else {
						data.errors.push(errors);
					}

				}
			}

			this.push(data);
			cb();
		} // end transform

}

/**
 * Extracts the type value and the severity of a given check name from the checkProperty
 * @param checkProperty The checkProperty as defined in the schema
 * @param fieldName The name of the field in the checkProperty
 * @return infoObject An object containing the boolean value and the severity
 */
function getCheckInfo(checkProperty, fieldName) {
	let severity;
	let value;
	if (typeof checkProperty[fieldName] === 'object') {
		severity = checkProperty[fieldName].severity;
		value = checkProperty[fieldName].val;
	} else {
		severity = checkProperty.severity;
		value = checkProperty[fieldName];
	}

	return {
		val: value,
		severity: severity
	};
}

module.exports = function (opts, validate) {
	return new DataProcessorRow(opts, validate);
};
