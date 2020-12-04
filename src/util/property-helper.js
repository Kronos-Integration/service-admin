/*global describe, it*/
/* jslint node: true, esnext: true */
'use strict';

module.exports = {
	/**
	 * Some of the values may be directly the value or could be an object with different
	 * addidtional properties. So to get the expected value it must be checked if the
	 * property is an object or not. If it is an object the real value is stored in the
	 * object under the property 'val'. See the json fieldDefinition.
	 * @param fieldDefinition The field_definition
	 * @param fieldTypePropertyName The name of the property. This property is under the fieldType
	 * @param propertyName The name of the property. This property is a sibling of fieldType
	 *
	 * Only one of the property names should be given
	 */
	getProperty: function (fieldDefinition, fieldTypePropertyName, propertyName) {
		if (fieldTypePropertyName) {
			if (fieldDefinition.fieldType.hasOwnProperty(fieldTypePropertyName)) {
				if (typeof fieldDefinition.fieldType[fieldTypePropertyName] === 'object') {
					return fieldDefinition.fieldType[fieldTypePropertyName].val;
				} else {
					return fieldDefinition.fieldType[fieldTypePropertyName];
				}
			}
		}

		if (propertyName) {
			if (fieldDefinition.hasOwnProperty(propertyName)) {
				if (typeof fieldDefinition[propertyName] === 'object') {
					return fieldDefinition[propertyName].val;
				} else {
					return fieldDefinition[propertyName];
				}
			}
		}

	},


	/**
	 * Returns the severity for a check property. The severity may be defined globaly
	 * for the complete field, but also may be defined on a per check basis
	 * @param fieldDefinition The field_definition
	 * @param fieldTypePropertyName The name of the property. This property is under the fieldType
	 * @param propertyName The name of the property. This property is a sibling of fieldType
	 *
	 * Only one of the property names should be given
	 */
	getSeverity: function (fieldDefinition, fieldTypePropertyName, propertyName) {
		let severity = fieldDefinition.severity;

		if (typeof fieldDefinition.fieldType === 'object') {

			if (fieldDefinition.fieldType.hasOwnProperty('severity')) {
				// If the field type has an own severity, take this one.
				severity = fieldDefinition.fieldType.severity;
			}

			if (fieldTypePropertyName) {
				if (fieldDefinition.fieldType[fieldTypePropertyName]) {
					if (fieldDefinition.fieldType[fieldTypePropertyName].hasOwnProperty('severity')) {
						// But if the check in the field type also has an own severity, then this one will be taken
						severity = fieldDefinition.fieldType[fieldTypePropertyName].severity;
					}
				}
			}
		}

		if (propertyName) {
			// in this case there is a sibling property line 'mandatory' which also could have an own severity.
			if (typeof fieldDefinition[propertyName] === 'object') {
				if (fieldDefinition[propertyName].hasOwnProperty('severity')) {
					severity = fieldDefinition[propertyName].severity;
				}
			}
		}

		return severity;
	},

	/**
	 * Returns the severity for a check property. The severity may be defined globaly
	 * for the complete field, but also may be defined on a per check basis
	 * @param fieldDefinition The field_definition
	 */
	getFieldType: function (fieldDefinition) {
		let type = fieldDefinition.fieldType;
		if (typeof type === 'object') {
			type = fieldDefinition.fieldType.type;
		}
		return type;
	}

};
