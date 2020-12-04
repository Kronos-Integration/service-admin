const functionHelper = require('../util/function-helper');
const propertyHelper = require('../util/property-helper');



module.exports = {

	/**
	 * Creates the checks for checking boolean values
	 * @param fieldDefinition The field_definition for this field.
	 * @param fieldName The name of the current field
	 */
	createChecks: function (fieldDefinition, fieldName) {
		const fieldType = propertyHelper.getFieldType(fieldDefinition);

		if (fieldType === 'boolean') {
			// it is a boolean field. Create the cehcks
			return createChecks(fieldDefinition, fieldName);
		}
	}
};


/**
 * Create a function which
 * checks that the value in a field is a valid boolean value.
 * If the value is boolean value, the boolean equivalent will be
 * stored in the content hash. Otherwise, the default value for
 * this field will be stored in the content hash instead.
 * @param fieldDefinition The field_definition for this field.
 * @param fieldName The name of the current field
 */
function createChecks(fieldDefinition, fieldName) {
	const severity = propertyHelper.getSeverity(fieldDefinition);

	let defaultValue;
	if (fieldDefinition.defaultValue !== undefined) {
		defaultValue = stringToBoolean(fieldDefinition.defaultValue);
		if (defaultValue === undefined) {
			throw {
				errorCode: 'NOT_BOOLEAN',
				severity: severity,
				value: fieldDefinition.defaultValue,
				message: 'The defaultValue in the fieldDefinition is not a valid boolean value.'
			};
		}
	}

	let errorInfo = {
		severity: severity,
		errorCode: 'NOT_BOOLEAN'
	};

	return functionHelper.getParserCheck(errorInfo, stringToBoolean, fieldName, defaultValue);
}


/*
 * Convert a value to a boolean value by comparing the upper case version
 * of this string to a list of true and false values.
 * If the given string is neither false-ish nor true-ish, null is returned.
 * @param string the string to check.
 * @return true or false, if the string is a true-ish or false-ish value
 *   respectiveley. Null otherwise.
 */
function stringToBoolean(string) {
	if (typeof string === 'boolean') {
		// nothing to do, just return
		return string;
	} else if (typeof string === 'number') {
		if (string === 0) {
			return false;
		}

		if (string === 1) {
			return true;
		}
	} else if (typeof string === 'string') {
		var trueValues = ['Y', 'J', 'T', 'JA', 'TRUE', 'YES', '1', 'S', 'SI'];
		var falseValues = ['N', 'F', 'NEIN', 'FALSE', 'NO', '0'];
		if (isElementInList(string, trueValues)) {
			return true;
		} else if (isElementInList(string, falseValues)) {
			return false;
		}
	}

	return undefined;
}

/*
 * This function tests whether the upper case version of a given string is
 * present in the supplied list
 * @param str The String to test.
 * @param list The list of Values, have to be upper cased
 * @return True if the check was successfull, false otherwise
 */
function isElementInList(str, list) {
	if (typeof str === 'string' && typeof list == 'object' && list.indexOf) {
		var strUpper = str.toUpperCase();
		return list.indexOf(strUpper) !== -1;
	} else {
		return false;
	}
}
