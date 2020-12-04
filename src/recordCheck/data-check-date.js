/*global describe, it*/
/* jslint node: true, esnext: true */
'use strict';
const moment = require('moment');

const propertyHelper = require('../util/property-helper');
const functionHelper = require('../util/function-helper');

module.exports = {
  /**
   * Creates the date checks for a date field
   * @param fieldDefinition The field_definition schema
   * @param fieldName The name of the current field
   */
  createChecks: function (fieldDefinition, fieldName) {
    const fieldType = propertyHelper.getFieldType(fieldDefinition);

    if (fieldType === 'date') {
      // This field is a date field. Create the checks
      return createDateChecks(fieldDefinition, fieldName);
    }
  }
};


/**
 * Create a function which
 * checks that the value in a field is a valid boolean value.
 * If the value is boolean value, the boolean equivalent will be
 * stored in the content hash. Otherwise, the default value for
 * this field will be stored in the content hash instead.
 * @param meta The meta data hash
 * @param checkProperty The properties defines which checks to be created. See the schema for more info
 * @param fieldname The name of the field which needs to be checked
 * @return function A function which will check a given content hash.
 */
function createDateChecks(fieldDefinition, fieldName) {
  let checks = [];

  // -----------------------
  // check default value
  // -----------------------
  let defaultValue;
  if (fieldDefinition.defaultValue !== undefined) {
    defaultValue = parseDateString(fieldDefinition.defaultValue);
    if (defaultValue === undefined) {
      throw {
        errorCode: 'NOT_DATE',
        fieldName: 'defaultValue',
        value: fieldDefinition.defaultValue,
        message: 'The defaultValue in the fieldDefinition is not a valid date value.'
      };
    }
  }
  // -----------------------
  // check min date
  // -----------------------
  let minDate;
  const minDateStr = propertyHelper.getProperty(fieldDefinition, 'minDate');
  if (minDateStr !== undefined) {
    minDate = parseDateString(minDateStr);
    // Check that the given minDate is a valid date
    if (!minDate) {
      throw {
        errorCode: 'NOT_DATE_MIN_DATE',
        fieldName: 'check minDate',
        value: minDateStr,
        message: 'The min date in the constraints is not valid'
      };
    }
  }

  // -----------------------
  // check max date
  // -----------------------
  let maxDate;
  const maxDateStr = propertyHelper.getProperty(fieldDefinition, 'maxDate');
  if (maxDateStr !== undefined) {
    maxDate = parseDateString(maxDateStr);
    // Check that the given minDate is a valid date
    if (!maxDate) {
      throw {
        errorCode: 'NOT_DATE_MAX_DATE',
        fieldName: 'maxDate',
        value: maxDateStr,
        message: 'The max date in the constraints is not valid'
      };
    }
  }

  const minDateSeverity = propertyHelper.getSeverity(fieldDefinition, 'minDate');
  const maxDateSeverity = propertyHelper.getSeverity(fieldDefinition, 'maxDate');


  // -----------------------------------------------------------------------
  // Create DATE Check
  // -----------------------------------------------------------------------


  /** ************************************************************************
   * Checks that the given value is a valid date
   * @param content the content hash to be validated.
   * @return error an error object if the given value is not a valid date
   * *************************************************************************
   */

  let errorInfo = {
    severity: fieldDefinition.severity,
    errorCode: 'NOT_DATE'
  };

  checks.push(functionHelper.getParserCheck(errorInfo, parseDateString, fieldName, defaultValue));

  // -----------------------------------------------------------------------
  // Create MIN_DATE Check
  // we need a further check to check the date against the min date
  // -----------------------------------------------------------------------
  if (minDate) {
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

            const date = parseDateString(item);
            if (date) {
              // it is a valid date.
              if (moment(date).isBefore(minDate)) {

                // this date is out of range
                errors.push({
                  errorCode: 'DATE_BEFORE_MIN_DATE',
                  severity: minDateSeverity,
                  fieldName: fieldName,
                  value: item,
                  message: minDate
                });
              }
            }

          });
        } else {
          const date = parseDateString(valueToCheck);
          if (date) {
            // it is a valid date.
            if (moment(date).isBefore(minDate)) {

              // this date is out of range
              errors.push({
                errorCode: 'DATE_BEFORE_MIN_DATE',
                severity: minDateSeverity,
                fieldName: fieldName,
                value: valueToCheck,
                message: minDate
              });
            }
          }
        }

        if (errors.length == 1) {
          return errors[0];
        } else if (errors.length > 0) {
          return errors;
        }


      }
    });
  }

  // -----------------------------------------------------------------------
  // Create MAX_DATE Check
  // we need a further check to check the date against the max date
  // -----------------------------------------------------------------------

  // we need a further check to check the date against the max date
  if (maxDate) {
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

            const date = parseDateString(item);
            if (date) {
              // it is a valid date.
              if (moment(date).isAfter(maxDate)) {

                // this date is out of range
                errors.push({
                  errorCode: 'DATE_EXEEDS_MAX_DATE',
                  severity: maxDateSeverity,
                  fieldName: fieldName,
                  value: item,
                  message: maxDate
                });
              }
            }

          });
        } else {
          const date = parseDateString(valueToCheck);
          if (date) {
            // it is a valid date.
            if (moment(date).isAfter(maxDate)) {

              // this date is out of range
              errors.push({
                errorCode: 'DATE_EXEEDS_MAX_DATE',
                severity: maxDateSeverity,
                fieldName: fieldName,
                value: valueToCheck,
                message: maxDate
              });
            }
          }
        }

        if (errors.length == 1) {
          return errors[0];
        } else if (errors.length > 0) {
          return errors;
        }
      }
    });

  }

  return checks;
}



function parseDateString(dateString) {
  if (dateString) {

    // dateString = dateString.replace(/\s*([+-]\d\d):(\d\d)\s*$/, " $1$2");
    // dateString = dateString.replace(/\s*([+-]\d):(\d\d)\s*$/, " $10$2");
    // dateString = dateString.replace(/\s*GMT\s*([+-]\d+)/, " $1");

    dateString = dateString.replace(/(\d{2,4}\D\d{2,4}\D\d{2,4}.*)\s*([+-]\d+:?\d+)\s*$/, '$1 $2');

    dateString = dateString.replace(/Z/i, ' GMT');
    dateString = dateString.replace(/UTC/i, ' GMT');
    dateString = dateString.replace(/UT/i, ' GMT');
    dateString = dateString.replace(/GMT/i, ' GMT');

    dateString = dateString.replace(/GMT\s*(\+|\-)/, '$1');
    dateString = dateString.replace(/GMT/, ' +0000');


    // Time separator will be replaced by a space
    dateString = dateString.replace(/T/i, ' ');

    // make a list of white spaces to one white space
    dateString = dateString.replace(/\s+/g, ' ');

    // split the date into its parts
    const dateTimeArray = dateString.split(/ +/);

    const datePart = dateTimeArray[0];
    let timePart = dateTimeArray[1];
    let timeZonePart = dateTimeArray[2];

    let dateFormatString;

    //--------------------------------
    // compute the format string
    //--------------------------------
    if (datePart.match(/\d{4}-\d{1,2}-\d{1,2}/)) {
      dateFormatString = 'YYYY-MM-DD';
    } else if (datePart.match(/\d{2}-\d{2}-\d{2}/)) {
      dateFormatString = 'YY-MM-DD';
    } else if (datePart.match(/\d{2}\.\d{2}\.\d{4}/)) {
      dateFormatString = 'DD.MM.YYYY';
    } else if (datePart.match(/\d{2}\.\d{2}\.\d{2}/)) {
      dateFormatString = 'DD.MM.YY';
    } else if (datePart.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
      dateFormatString = 'MM/DD/YYYY';
    } else if (datePart.match(/\d{2}\/\d{2}\/\d{2}/)) {
      dateFormatString = 'MM/D/YY';
    } else if (datePart.match(/\d{8}/)) {
      dateFormatString = 'YYYYMMDD';
    } else {
      return null;
    }


    //--------------------------------
    // prepare time
    //--------------------------------
    if (timePart) {
      // replace dashes by colons
      timePart = timePart.replace(/-/i, ':');

      // add seconds to the time if absence
      timePart = timePart.replace(/^(\d{2}):(\d{2})( |$)/, function (
        match, p1, p2, offset, val) {
        return p1 + ':' + p2 + ':00';
      });

      dateFormatString = dateFormatString + ' HH:mm:ss';
    }

    //--------------------------------
    // prepare time zone
    //--------------------------------
    if (timeZonePart) {

      // Delete the colon
      timeZonePart = timeZonePart.replace(/\s*([+-])(\d):(\d)\s*$/, ' $10$20$3');
      timeZonePart = timeZonePart.replace(/\s*([+-])(\d):(\d\d)\s*$/, ' $10$2$3');
      timeZonePart = timeZonePart.replace(/\s*([+-])(\d\d):(\d)\s*$/, ' $1$20$3');

      timeZonePart = timeZonePart.replace(/^([+-])(\d)$/, function (
        match,
        p1, p2) {
        return p1 + '0' + p2 + '00';
      });

      timeZonePart = timeZonePart.replace(/^([+-]\d\d)$/, function (
        match,
        p1) {
        return p1 + '00';
      });

      timeZonePart = timeZonePart.replace(/^([+-])(\d\d\d)$/, function (
        match, p1, p2) {
        return p1 + '0' + p2;
      });

      dateFormatString = dateFormatString + ' ZZ';
    }

    const date = moment.utc(datePart + ' ' + timePart + ' ' + timeZonePart, dateFormatString);
    if (date.isValid()) {
      return date.toISOString();
    } else {
      return null;
    }
  }
}
