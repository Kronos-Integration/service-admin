/*global describe, it*/
/* jslint node: true, esnext: true */
'use strict';

const propertyHelper = require('../util/property-helper');


module.exports = {
	/**
	 * Creates the checks which are common to each file type
	 * @param fieldDefinition The field_definition for this field.
	 * @param fieldName The name of the current field
	 */
	createChecks: function (fieldDefinition, fieldName) {
		const severity = propertyHelper.getSeverity(fieldDefinition, undefined, 'mandatory');
		const isMandatoy = propertyHelper.getProperty(fieldDefinition, undefined, 'mandatory');

		// const severity = fieldDefinition.severity;
		// const isMandatoy = fieldDefinition.mandatory;

		if (isMandatoy === true) {
			/**
			 * Just check if for mandatory fields the value is given
			 * @param content the content hash to be validated.
			 */
			return function (content) {
				// get the value from the content hash
				const valueToCheck = content[fieldName];

				// If the value is defined, we need to check it
				if (valueToCheck === undefined || valueToCheck === null) {
					return {
						errorCode: 'MANDATORY_VALUE_MISSING',
						severity: severity,
						fieldName: fieldName
					};
				}
			};

		}
	}
};
