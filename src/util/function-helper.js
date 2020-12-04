/*global describe, it*/
/* jslint node: true, esnext: true */
'use strict';

module.exports = {


	getParserCheck: function (errorInfo, parseFunction, fieldName, defaultValue) {
		return function (content) {
			// get the value from the content hash
			const valueToCheck = content[fieldName];

			// If the value is defined, we need to check it
			if (valueToCheck !== undefined && valueToCheck !== null) {
				if (Array.isArray(valueToCheck)) {
					let errors = [];
					valueToCheck.forEach(function (item, idx, arr) {
						if (item !== undefined && item !== null) {
							//****************
							const newValue = parseFunction(item);
							//****************
							if (newValue !== undefined && newValue !== null) {
								// The value was parsed successfully
								arr[idx] = newValue;
							} else {
								errors.push({
									errorCode: errorInfo.errorCode,
									severity: errorInfo.severity,
									fieldName: fieldName,
									value: item
								});

								arr[idx] = defaultValue;
							}
						} else {
							arr[idx] = defaultValue;
						}
					});

					content[fieldName] = valueToCheck;

					if (errors.length == 1) {
						return errors[0];
					} else if (errors.length > 0) {
						return errors;
					}

				} else {
					//****************
					const newValue = parseFunction(valueToCheck);
					//****************
					if (newValue !== undefined && newValue !== null) {
						// it is a boolean value. Store it instead of the string
						content[fieldName] = newValue;
					} else {
						if (defaultValue !== undefined) {
							content[fieldName] = defaultValue;
						}
						return {
							errorCode: errorInfo.errorCode,
							severity: errorInfo.severity,
							fieldName: fieldName,
							value: valueToCheck
						};
					}

				}

			} else {
				// set the default value. If no default was given it is null.
				if (defaultValue !== undefined) {
					content[fieldName] = defaultValue;
				}
			}
		};
	}
};
