var TMP_DEVIDER = '<--DIVIDER-->';

module.exports = {
	/**
	 * Creates the field splitter for a field, if this field is a multi field
	 * @param fieldDefinition The field_definition schema
	 * @param fieldName The name of the current field
	 */
	createChecks: function (fieldDefinition, fieldName) {
		if (fieldDefinition.hasOwnProperty('multiField')) {
			// if it is not a multifield no check is to be created
			return createSplitterForField(fieldDefinition.multiField, fieldName);
		}
	}
};


/**
 * Create the field spliter for a given field definition
 * The field must be a multiField.
 *
 * @param multiFieldDefinitionPart The multiField part of aa field definition for one field.
 * @param fieldName The name of the current multiField
 */
function createSplitterForField(multiFieldDefinitionPart, fieldName) {

	if (multiFieldDefinitionPart === undefined) {
		throw ("'multiFieldDefinitionPart' must not be undefined");
	}
	if (fieldName === undefined) {
		throw ("'fieldName' must not be undefined");
	}

	const delimiter = multiFieldDefinitionPart.delimiter;
	let escapeChar = multiFieldDefinitionPart.escapeChar;
	let removeWhiteSpace = true;
	let uniqueFields = true;
	let sortFields = true;
	let removeEmpty = true;

	// set default values
	if (multiFieldDefinitionPart.removeWhiteSpace !== undefined) {
		// remove leading and trailing whitespaces
		removeWhiteSpace = multiFieldDefinitionPart.removeWhiteSpace;
	}

	if (multiFieldDefinitionPart.uniqueFields !== undefined) {
		// remove duplicates from the list
		uniqueFields = multiFieldDefinitionPart.uniqueFields;
	}

	if (multiFieldDefinitionPart.sortFields !== undefined) {
		// sort the fields
		sortFields = multiFieldDefinitionPart.sortFields;
	}
	if (multiFieldDefinitionPart.removeEmpty !== undefined) {
		// Empty fields will be deleted
		removeEmpty = multiFieldDefinitionPart.removeEmpty;
	}


	return function (content) {
		if (content.hasOwnProperty(fieldName)) {
			// the field exists in the content record
			let fieldValue = content[fieldName];
			if (fieldValue) {

				// ------------------------------------------------
				// escape delimiter
				// ------------------------------------------------
				if (escapeChar) {
					escapeChar = escapeChar.replace(/\\/, "\\\\");
					escapeChar = escapeChar.replace(/\//, "\\/");

					// The escaped delimiter will be replaced by the string '<--DIVIDER-->'
					let re = new RegExp(escapeChar + delimiter, 'g');
					fieldValue = fieldValue.replace(re, TMP_DEVIDER);
				}

				// ------------------------------------------------
				// split the string
				// ------------------------------------------------
				let values = fieldValue.split(delimiter);

				if (escapeChar) {
					// remove the escape char
					let re = new RegExp(TMP_DEVIDER, 'g');
					for (let i = 0; i < values.length; i++) {
						values[i] = values[i].replace(re, delimiter);
					}
				}


				// ------------------------------------------------
				// remove the leading and trailing whiteSpaces
				// ------------------------------------------------
				if (removeWhiteSpace) {
					for (let i = 0; i < values.length; i++) {
						values[i] = values[i].trim();
					}
				}

				// ------------------------------------------------
				// remove empty fields
				// ------------------------------------------------
				if (removeEmpty) {
					let i = 0;
					let j = 0;
					for (i = 0; i < values.length; i++) {
						if (values[i]) {
							values[j] = values[i];
							j++;
						}
					}
					values.splice(j, i);
				}

				// ------------------------------------------------
				// sort fields
				// ------------------------------------------------
				if (sortFields) {
					values.sort();
				}

				// ------------------------------------------------
				// remove duplicates
				// ------------------------------------------------
				if (uniqueFields) {
					values = values.filter(function (elem, pos) {
						return values.indexOf(elem) == pos;
					});
				}

				// ------------------------------------------------
				// store the splited fields back to the content
				// ------------------------------------------------
				content[fieldName] = values;
			}
		}

		return null;
	};
}
