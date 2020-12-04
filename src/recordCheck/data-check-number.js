/*global describe, it*/
/* jslint node: true, esnext: true */
'use strict';
const propertyHelper = require('../util/property-helper');

module.exports = {

  /**
   * Creates the field splitter for a field, if this field is a multi field
   * @param fieldDefinition The field_definition for this field.
   * @param fieldName The name of the current field
   */
  createChecks: function (fieldDefinition, fieldName) {
    const fieldType = propertyHelper.getFieldType(fieldDefinition);

    let checks;
    if (fieldType === 'number' || fieldType === 'integer' || fieldType === 'float') {
      checks = createChecks(fieldDefinition, fieldName, fieldType);
    }

    return checks;
  }
};


/**
 * Checks a given string value.
 * Checks the length and if it matches a given regular expression
 * @param fieldDefinition The field_definition for this field.
 * @param fieldName The name of the current field
 * @param numberType The type of the field (number, integer, float)
 * @return checks A list of checks to be perfomred
 */
function createChecks(fieldDefinition, fieldName, numberType) {
  let checks = [];

  const decimalSeparator = propertyHelper.getProperty(fieldDefinition, 'decimalSeparator');
  const min = propertyHelper.getProperty(fieldDefinition, 'min');
  const max = propertyHelper.getProperty(fieldDefinition, 'max');

  const minSeverity = propertyHelper.getSeverity(fieldDefinition, 'min');
  const maxSeverity = propertyHelper.getSeverity(fieldDefinition, 'max');
  const severity = fieldDefinition.severity;

  const defaultValue = parseNumberString(fieldDefinition.defaultValue, numberType, decimalSeparator);
  if (typeof defaultValue === 'string') {
    throw {
      errorCode: defaultValue, // The return value is either a number, float, integer or an error message
      value: fieldDefinition.defaultValue,
      message: 'The defaultValue in the fieldDefinition is not a valid number in the given format.'
    };
  }


  /** ************************************************************************
   * Checks that the given value is a valid number in the right type (number, integer, float)
   * @param content the content hash to be validated.
   * @return error an error object if the given value is not a valid number
   * *************************************************************************
   */
  checks.push(function (content) {
    // get the value from the content hash
    const valueToCheck = content[fieldName];

    // If the value is defined, we need to check it
    if (valueToCheck !== undefined && valueToCheck !== null && valueToCheck.length > 0) {

      let errors = [];

      if (Array.isArray(valueToCheck)) {
        valueToCheck.forEach(function (item, idx, arr) {
          const myNumber = parseNumberString(item, numberType, decimalSeparator);

          if (typeof myNumber === 'string') {
            arr[idx] = defaultValue;

            errors.push({
              errorCode: myNumber,
              severity: severity,
              fieldName: fieldName,
              value: item
            });
          } else {
            arr[idx] = myNumber;
          }
        });

        content[fieldName] = valueToCheck;
      } else {
        const myNumber = parseNumberString(valueToCheck, numberType, decimalSeparator);

        if (typeof myNumber === 'string') {
          if (defaultValue !== undefined) {
            content[fieldName] = defaultValue;
          }
          errors.push({
            errorCode: myNumber,
            severity: severity,
            fieldName: fieldName,
            value: valueToCheck
          });
        } else {
          content[fieldName] = myNumber;
        }
      }

      if (errors.length == 1) {
        return errors[0];
      } else if (errors.length > 1) {
        return errors;
      }

    } else {
      if (defaultValue !== undefined) {
        content[fieldName] = defaultValue;
      }
    }
  });

  // -----------------------------------------------------------------------
  // Create MIN Check
  // we need a further check to check the number against the min value
  // -----------------------------------------------------------------------
  if (min) {
    /**
     * Checks that the given value is not before the given min value
     * @param content the content hash to be validated.
     * @return error an error object if the given value is not a valid date
     */
    checks.push(function (content) {
      const valueToCheck = content[fieldName];
      // If the value is defined, we need to check it
      if (valueToCheck !== undefined && valueToCheck !== null) {
        // do the work

        let errors = [];

        if (Array.isArray(valueToCheck)) {
          valueToCheck.forEach(function (item, idx, arr) {
            const myNumber = parseNumberString(item, numberType, decimalSeparator);

            if (item < min) {
              arr[idx] = defaultValue;

              errors.push({
                errorCode: 'NUMBER_LESS_THEN_MIN_VALUE',
                severity: minSeverity,
                fieldName: fieldName,
                value: item,
                message: min
              });
            }
          });

          content[fieldName] = valueToCheck;
        } else {
          const myNumber = parseNumberString(valueToCheck, numberType, decimalSeparator);

          if (valueToCheck < min) {
            if (defaultValue !== undefined) {
              content[fieldName] = defaultValue;
            }
            errors.push({
              errorCode: 'NUMBER_LESS_THEN_MIN_VALUE',
              severity: minSeverity,
              fieldName: fieldName,
              value: valueToCheck,
              message: min
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
  // Create MAX Check
  // we need a further check to check the number against the max value
  // -----------------------------------------------------------------------
  if (max) {

    /**
     * Checks that the given value is not before the given min date
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
            const myNumber = parseNumberString(item, numberType, decimalSeparator);

            if (item > max) {
              arr[idx] = defaultValue;

              errors.push({
                errorCode: 'NUMBER_GREATER_THEN_MAX_VALUE',
                severity: maxSeverity,
                fieldName: fieldName,
                value: item,
                message: max
              });
            }
          });

          content[fieldName] = valueToCheck;
        } else {
          const myNumber = parseNumberString(valueToCheck, numberType, decimalSeparator);

          if (valueToCheck > max) {
            if (defaultValue !== undefined) {
              content[fieldName] = defaultValue;
            }
            errors.push({
              errorCode: 'NUMBER_GREATER_THEN_MAX_VALUE',
              severity: maxSeverity,
              fieldName: fieldName,
              value: valueToCheck,
              message: max
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



/**
 * Parses a string and try to convert it in a valid number.
 * If the string does not match a valid number it will return the error message, else the parsed number.
 * @param numberString The string to be checked
 * @param type The expected type ["float", "integer", "number"]
 * @param decimalSeparator The used decimal separator.
 */
function parseNumberString(numberString, type, decimalSeparator) {
  let result;
  if (numberString !== undefined) {
    if (typeof numberString === 'string') {
      // The given value is a string

      if (decimalSeparator === ',') {
        numberString = numberString.replace(/\./g, '');
        numberString = numberString.replace(/,/g, '\.');
      } else {
        numberString = numberString.replace(/,/g, '');
      }


      if (numberString.match(/[^0-9\.]/g)) {
        // check if the string contains NO number values
        result = 'NUMBER_NOT_VALID';
      } else if ((numberString.match(/\./g) || []).length > 1) {
        // proof that only one decimal separator exists
        result = 'NUMBER_NOT_VALID';
      } else {
        if (type === 'float') {
          result = parseFloat(numberString);
          if (result === undefined) {
            result = 'NOT_FLOAT';
          }
        } else if (type === 'integer') {
          if (numberString.match(/\./g)) {
            result = 'NOT_INTEGER';
          } else {
            result = parseInt(numberString);
            if (result === undefined) {
              result = 'NOT_INTEGER';
            }
          }
        } else if (type === 'number') {
          result = parseFloat(numberString);
          if (result === undefined) {
            result = parseInt(numberString);
            result = 'NUMBER_NOT_VALID';
          }
        }
      }
    } else if (typeof numberString === 'number') {
      result = numberString;
    } else {
      result = 'NUMBER_NOT_VALID';
    }
  }
  return result;
}
