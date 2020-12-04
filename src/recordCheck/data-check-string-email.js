/*global describe, it*/
/* jslint node: true, esnext: true */
'use strict';
const propertyHelper = require('../util/property-helper');
const functionHelper = require('../util/function-helper');

module.exports = {

  /**
   * Creates the field splitter for a field, if this field is a multi field
   * @param fieldDefinition The field_definition for this field.
   * @param fieldName The name of the current field
   */
  createChecks: function (fieldDefinition, fieldName) {
    const fieldType = propertyHelper.getFieldType(fieldDefinition);

    let checks;
    if (fieldType === 'string' || fieldType === 'email') {
      // first create the string checks
      checks = createChecksString(fieldDefinition, fieldName);
    }

    if (fieldType === 'email') {
      // for email an additional check will be added
      checks.push(createCheckEmail(fieldDefinition, fieldName));
    }

    // This must be the last one, because the email check will delete the value from the content
    if (fieldType === 'string' || fieldType === 'email') {
      const defaultValueCheck = createCheckDefaultValue(fieldDefinition, fieldName);
      if (defaultValueCheck !== undefined) {
        checks.push(defaultValueCheck);
      }
    }
    return checks;
  }
};

/**
 * Checks if a given string looks like a valid email.
 * @param fieldDefinition The field_definition for this field.
 * @param fieldName The name of the current field
 * @return The check
 */
function createCheckEmail(fieldDefinition, fieldName) {
  const severity = propertyHelper.getSeverity(fieldDefinition);

  // return getIteratorFunction: function (fieldName, defaultValue, checkProperties, checkFunction, getErrorFunction,
  // 	getValueIfErrorFunction, getValueIfOkFunction) {

  let errorInfo = {
    severity: severity,
    errorCode: 'NOT_EMAIL'
  };

  return functionHelper.getParserCheck(errorInfo, getEmailIfValid, fieldName, undefined);

}

/**
 * Set the default value if no value is there
 * @param fieldDefinition The field_definition for this field.
 * @param fieldName The name of the current field
 * @return checks A list of checks to be perfomred
 */
function createCheckDefaultValue(fieldDefinition, fieldName) {
  const defaultValue = fieldDefinition.defaultValue;

  // -----------------------------------------------------------------------
  // Set default value
  // -----------------------------------------------------------------------
  return function (content) {

    const valueToCheck = content[fieldName];
    // If the value is defined, we need to check it
    if (valueToCheck === undefined || valueToCheck === null) {
      if (defaultValue !== undefined) {
        content[fieldName] = defaultValue;
      }
    } else {
      if (Array.isArray(valueToCheck)) {
        valueToCheck.forEach(function (item, idx, arr) {
          if (item === undefined || item === null) {
            arr[idx] = defaultValue;
          }
        });
      }
    }
  };
}


/**
 * Checks a given string value.
 * Checks the length and if it matches a given regular expression
 * @param fieldDefinition The field_definition for this field.
 * @param fieldName The name of the current field
 * @return checks A list of checks to be perfomred
 */
function createChecksString(fieldDefinition, fieldName) {
  let checks = [];

  const fieldCase = propertyHelper.getProperty(fieldDefinition, 'fieldCase');
  const minLength = propertyHelper.getProperty(fieldDefinition, 'minLength');
  const maxLength = propertyHelper.getProperty(fieldDefinition, 'maxLength');
  const regExStr = propertyHelper.getProperty(fieldDefinition, 'regEx');
  let regEx;
  if (regExStr) {
    regEx = new RegExp(regExStr);
  }


  const minLengthSeverity = propertyHelper.getSeverity(fieldDefinition, 'minLength');
  const maxLengthSeverity = propertyHelper.getSeverity(fieldDefinition, 'maxLength');
  const regExSeverity = propertyHelper.getSeverity(fieldDefinition, 'regEx');

  // -----------------------------------------------------------------------
  // Create FIELD CASE Check
  // -----------------------------------------------------------------------
  /*
   * The first check is only for updating the string to lower or to upper case.
   * It will not reurn any error
   */
  if (fieldCase !== undefined) {

    /**
     * Changes the case of a string to the given value (upper, lower)
     */
    checks.push(function (content) {
      const valueToCheck = content[fieldName];
      // If the value is defined, we need to check it
      if (valueToCheck !== undefined && valueToCheck !== null) {
        if (Array.isArray(valueToCheck)) {
          valueToCheck.forEach(function (item, idx, arr) {
            if (item === undefined || item === null) {

              if (fieldCase === 'lower') {
                arr[idx] = item.toLowerCase();
              } else if (fieldCase === 'upper') {
                arr[idx] = item.toUpperCase();
              }
            }
          });
        } else {
          if (fieldCase === 'lower') {
            content[fieldName] = valueToCheck.toLowerCase();
          } else if (fieldCase === 'upper') {
            content[fieldName] = valueToCheck.toUpperCase();
          }
        }
      }
    });
  }


  // -----------------------------------------------------------------------
  // Create MIN LENGTH Check
  // -----------------------------------------------------------------------
  if (minLength !== undefined) {
    /**
     * Checks that the given string has a minimum length
     * @param content the content hash to be validated.
     * @return error an error object if the given value is too short
     */
    checks.push(function (content) {
      const valueToCheck = content[fieldName];
      // If the value is defined, we need to check it
      if (valueToCheck !== undefined && valueToCheck !== null) {

        let errors = [];

        if (Array.isArray(valueToCheck)) {
          valueToCheck.forEach(function (item, idx, arr) {
            if (item.length < minLength) {
              errors.push({
                errorCode: 'STRING_MIN_LENGTH',
                severity: minLengthSeverity,
                fieldName: fieldName,
                value: item,
                message: minLength
              });
            }
          });
        } else {
          if (valueToCheck.length < minLength) {
            errors.push({
              errorCode: 'STRING_MIN_LENGTH',
              severity: minLengthSeverity,
              fieldName: fieldName,
              value: valueToCheck,
              message: minLength
            });
          }
        }

        if (errors.length == 1) {
          return errors[0];
        } else if (errors.length > 1) {
          return errors;
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Create MAX LENGTH Check
  // -----------------------------------------------------------------------
  if (maxLength !== undefined) {
    /**
     * Checks that the given string does not exeed the maximum length
     * @param content the content hash to be validated.
     * @return error an error object if the given value is too long
     */
    checks.push(function (content) {
      const valueToCheck = content[fieldName];
      // If the value is defined, we need to check it
      if (valueToCheck !== undefined && valueToCheck !== null) {

        let errors = [];

        if (Array.isArray(valueToCheck)) {
          valueToCheck.forEach(function (item, idx, arr) {
            if (item.length > maxLength) {
              arr[idx] = item.substring(0, maxLength);

              errors.push({
                errorCode: 'STRING_MAX_LENGTH',
                severity: maxLengthSeverity,
                fieldName: fieldName,
                value: item,
                message: maxLength
              });
            }
          });

          content[fieldName] = valueToCheck;
        } else {
          if (valueToCheck.length > maxLength) {
            content[fieldName] = valueToCheck.substring(0, maxLength);

            errors.push({
              errorCode: 'STRING_MAX_LENGTH',
              severity: maxLengthSeverity,
              fieldName: fieldName,
              value: valueToCheck,
              message: maxLength
            });
          }
        }

        if (errors.length == 1) {
          return errors[0];
        } else if (errors.length > 1) {
          return errors;
        }
      }
    });
  }

  // -----------------------------------------------------------------------
  // Create REG EX Check
  // -----------------------------------------------------------------------
  if (regEx !== undefined) {
    /**
     * Checks that the given string has a minimum length
     * @param content the content hash to be validated.
     * @return error an error object if the given value is not a valid date
     */
    checks.push(function (content) {
      const valueToCheck = content[fieldName];
      // If the value is defined, we need to check it
      if (valueToCheck !== undefined && valueToCheck !== null) {

        let errors = [];

        if (Array.isArray(valueToCheck)) {
          valueToCheck.forEach(function (item, idx, arr) {
            if (!regEx.test(item)) {
              arr[idx] = item.substring(0, maxLength);

              errors.push({
                errorCode: 'STRING_REG_EX',
                severity: regExSeverity,
                fieldName: fieldName,
                value: item,
                message: regExStr
              });
            }
          });
        } else {
          if (!regEx.test(valueToCheck)) {
            errors.push({
              errorCode: 'STRING_REG_EX',
              severity: regExSeverity,
              fieldName: fieldName,
              value: valueToCheck,
              message: regExStr
            });
          }
        }

        if (errors.length == 1) {
          return errors[0];
        } else if (errors.length > 1) {
          return errors;
        }
      }
    });
  }
  return checks;
}

// JS compatible regex to test if a string is a valid e-mail address.
// This is a permissive test and only tests the syntax, not the availablity of
// for example the top level domains, if the domain itself is registered, etc.
// Only very, very vew valid e-mail addresses are rejected however.
// See http://www.regular-expressions.info/email.html for more information about
// this regex.
const emailRegex =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;


/*
 * Checks if a given email address is syntactically valid.
 * @param emailToVerify the email address to verify
 * @return the valid email address, stipped from whitespace if it is valid, null
 *   otherwise
 */
function getEmailIfValid(emailToVerify) {
  if (emailToVerify) {
    const email = emailToVerify.trim();
    if (emailRegex.test(email)) {
      return email;
    } else {
      return undefined;
    }
  }
}
