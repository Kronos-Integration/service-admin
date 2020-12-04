import { Transform } from "stream";

const ZSchema = require("z-schema");
const validator = new ZSchema({});
const schema = require("../schema/header.json");

class LineHeader extends Transform {
  /**
   * @checkProperty The header configuration.
   * @validate If set to a true value, the given opts will be validate by JSON schema
   */
  constructor(checkProperty, validate) {
    // call the constrctor of stream.Transform
    super({
      objectMode: true,
      highWaterMark: 16
    });

    if (validate) {
      // Validate the given options
      const ZSchema = require("z-schema");
      const validator = new ZSchema({});

      // first check if the checkProperty is valid
      const valid = validator.validate(checkProperty, schema);
      const validationErrors = validator.getLastErrors();

      if (validationErrors) {
        // There where validation errors
        throw validationErrors;
      }
    }

    // Stores all the checks to be executed
    this.checks = [];

    // --------------------------------
    // get the expected header
    // --------------------------------
    const expectedHeader = checkProperty.expectedHeader;
    if (!expectedHeader) {
      // no expected header given.
      throw "There is no expected header defined in the checkproperty.";
    }

    if (!Array.isArray(expectedHeader)) {
      throw "The expected header must be an array, even if it contains just one column.";
    }

    // get the strict property and its severity

    // create the pre checks
    this.checks.push(getPreCheck());

    // The strict header check
    const checkInfoStrict = getCheckInfo(checkProperty, "strict");
    if (checkInfoStrict.val) {
      this.checks.push(
        getStrictCheck(
          expectedHeader,
          checkProperty.caseSensitive,
          checkInfoStrict.severity
        )
      );
    }

    // get the missingColumns property and its severity
    const checkInfoMissingColumns = getCheckInfo(
      checkProperty,
      "missingColumns"
    );
    if (checkInfoMissingColumns.val === false) {
      this.checks.push(
        getMissingColumnCheck(
          expectedHeader,
          checkProperty.caseSensitive,
          checkInfoMissingColumns.severity
        )
      );
    }

    // get the additionalColumns property and its severity
    const checkInfoAdditionalColumns = getCheckInfo(
      checkProperty,
      "additionalColumns"
    );
    if (checkInfoAdditionalColumns.val === false) {
      this.checks.push(
        getAdditionalColumnCheck(
          expectedHeader,
          checkProperty.caseSensitive,
          checkInfoAdditionalColumns.severity
        )
      );
    }

    this.fieldMapCheck = getRealHeaderCheck(
      expectedHeader,
      checkProperty.caseSensitive,
      checkProperty.fieldNames
    );
    this.fieldNames = checkProperty.fieldNames;

    // get the mandatoryColumns property and its severity
    // The mandatoryColumns will be checked against the fieldNames found
    if (checkProperty.mandatoryColumns) {
      let mandatoryColumns;
      let severity;
      if (Array.isArray(checkProperty.mandatoryColumns)) {
        severity = checkProperty.severity;
        mandatoryColumns = checkProperty.mandatoryColumns;
      } else {
        severity = checkProperty.mandatoryColumns.severity;
        mandatoryColumns = checkProperty.mandatoryColumns.val;
      }
      this.mandatoryColumnCheck = getMandatoryColumnCheck(
        mandatoryColumns,
        severity
      );
    }
  }

  /**
   * Reads the stream data and split it into lines.
   */
  _transform(data, enc, cb) {
    let fieldData = data.data; // The data from the request
    let lineNumber = data.lineNumber; // The curent line number

    if (lineNumber === 0) {
      // Only check the first line
      this.checks.forEach(function (check) {
        let err = check(fieldData);
        if (err) {
          if (!data.error) {
            data.error = [];
          }
          if (Array.isArray(err)) {
            data.error.push.apply(err);
          } else {
            data.error.push(err);
          }
        }
      });

      let fieldMap = this.fieldMapCheck(fieldData);
      let header = [];
      let foundColumns = [];
      for (let i = 0; i < fieldData.length; i++) {
        header[i] = fieldMap[i];
        if (fieldMap[i]) {
          foundColumns.push(fieldMap[i]);
        }
      }

      data.header = header;

      if (this.mandatoryColumnCheck) {
        let err = this.mandatoryColumnCheck(foundColumns);
        if (err) {
          if (!data.error) {
            data.error = [];
          }
          if (Array.isArray(err)) {
            data.error.push.apply(err);
          } else {
            data.error.push(err);
          }
        }
      }
    }

    this.push(data);
    cb();
  } // end transform
}

/**
 * Creates a check which will match the future columns names to there real position
 * @param expectedHeader The expected header
 * @param caseSensitive Is the header case sensitive
 * @param fieldNames The fieldNames to use for each field.
 * @return fieldMap This maps the fieldNames to the position in the array.
 */
function getRealHeaderCheck(expectedHeader, caseSensitive, fieldNames) {
  return function (content) {
    let actualHeader;
    if (caseSensitive) {
      actualHeader = content;
    } else {
      actualHeader = arrayToUpperCase(content);
      expectedHeader = arrayToUpperCase(expectedHeader);
    }

    // the header must have all the expected columns but may have more
    return _getRealHeader(expectedHeader, actualHeader, fieldNames);
  };
}

/*
 * Compares an expected array against an actual array and checks that all the columns
 * from the expected array exists in the actual array. Each missing value will be returned
 *
 * @param expectedHeader The expected array
 * @param actualHeader The actual array
 * @param fieldNames The fieldNames to use for each field.
 * @return fieldMap This maps the fieldNames to the position in the array.
 *
 */
function _getRealHeader(expectedHeader, actualHeader, fieldNames) {
  // Stores for each existing field the postion in the array
  let fieldMap = {};

  for (let i = 0; i < expectedHeader.length; i++) {
    let found = false;
    for (let j = 0; j < actualHeader.length; j++) {
      if (Array.isArray(expectedHeader[i])) {
        for (let k = 0; k < expectedHeader[i].length; k++) {
          if (expectedHeader[i][k] === actualHeader[j]) {
            found = true;
            fieldMap[j] = fieldNames[i];
          }
        }
      } else {
        if (expectedHeader[i] === actualHeader[j]) {
          found = true;
          fieldMap[j] = fieldNames[i];
        }
      }
      if (found) {
        break;
      }
    }
  }

  return fieldMap;
}

/**
 * Extracts the boolean value and the severity of a given check name from the checkProperty
 * @param checkProperty The checkProperty as defined in the schema
 * @param fieldName The name of the field in the checkProperty
 * @return infoObject An object containing the boolean value and the severity
 */
function getCheckInfo(checkProperty, fieldName) {
  let severity;
  let value;
  if (typeof checkProperty[fieldName] === "object") {
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

/**
 * The pre check will be performed anyhow. It just checks that the content to check exists.
 */
function getPreCheck() {
  return function (content) {
    if (!content) {
      // no expected header given.
      throw "The given content is empty. So now header check could be performed.";
    }

    if (!Array.isArray(content)) {
      throw "The given header must be an array, even if it contains just one column.";
    }
  };
}

/*
 * Makes all the elements of an array to uppercase
 * @param array The array to modify
 * @return An array with all elements as upper case.
 */
function arrayToUpperCase(array) {
  let newArray = array.map(function (item) {
    if (Array.isArray(item)) {
      item = item.map(function (item) {
        return item.toUpperCase();
      });
    } else {
      return item.toUpperCase();
    }
  });

  return newArray;
}

/**
 * returns the Strict header check
 * @param expectedHeader The expected header
 */
function getStrictCheck(expectedHeader, caseSensitive, severity) {
  return function (content) {
    let actualHeader;
    if (caseSensitive) {
      actualHeader = content;
    } else {
      actualHeader = arrayToUpperCase(content);
      expectedHeader = arrayToUpperCase(expectedHeader);
    }

    if (expectedHeader.length !== actualHeader.length) {
      // If the length is different, it could not be the same
      return {
        errorCode: "CHECK_HEADER_NO_STRICT_MATCH",
        severity: severity,
        message:
          "The expected header [" +
          expectedHeader +
          "] has a different column count to the actual header [" +
          actualHeader +
          "]"
      };
    } else {
      // no we need to compare field by field because the expected array could be an array of arrays
      // The expected header may contain alternative names for one column.
      for (let i = 0; i < expectedHeader.length; i++) {
        let match = false;
        const actualVal = actualHeader[i];
        let expectedVal = expectedHeader[i];
        if (Array.isArray(expectedVal)) {
          for (let j = 0; j < expectedVal.length; j++) {
            if (actualVal === expectedVal[j]) {
              match = true;
            }
          }
        } else {
          if (actualVal === expectedVal) {
            match = true;
          }
        }
        if (!match) {
          return {
            errorCode: "CHECK_HEADER_NO_STRICT_MATCH",
            severity: severity,
            message:
              "The expected header [" +
              expectedHeader +
              "] does not match the actual header [" +
              actualHeader +
              "]"
          };
        }
      }
    }
  };
}

/*
 * Compares an expected array against an actual array and checks that the actual array
 * has no columns which are not in the expected array. The fields in the expected array
 * could be also arrays.
 * @param expectedHeader The expected array
 * @param actualHeader The actual array
 * @return An array with all the missing values.
 */
function additionalColumns(expectedHeader, actualHeader) {
  let errorColumns = [];

  for (let i = 0; i < actualHeader.length; i++) {
    let found = false;
    for (let j = 0; j < expectedHeader.length; j++) {
      // does the column has alternative column names
      if (Array.isArray(expectedHeader[j])) {
        for (let k = 0; k < expectedHeader[j].length; k++) {
          if (expectedHeader[j][k] === actualHeader[i]) {
            found = true;
            break;
          }
        }
      } else {
        if (expectedHeader[j] === actualHeader[i]) {
          found = true;
        }
      }
      if (found) {
        break;
      }
    }

    if (!found) {
      errorColumns.push(actualHeader[i]);
    }
  }

  if (errorColumns.length > 0) {
    return errorColumns;
  }
}

/*
 * Compares an expected array against an actual array and checks that all the columns
 * from the expected array exists in the actual array. Each missing value will be returned
 *
 * @param expectedHeader The expected array
 * @param actualHeader The actual array
 * @return An array with all the missing values.
 */
function _missingColumns(expectedHeader, actualHeader) {
  let errorColumns = [];

  for (let i = 0; i < expectedHeader.length; i++) {
    let found = false;
    for (let j = 0; j < actualHeader.length; j++) {
      if (Array.isArray(expectedHeader[i])) {
        for (let k = 0; k < expectedHeader[i].length; k++) {
          if (expectedHeader[i][k] === actualHeader[j]) {
            found = true;
          }
        }
      } else {
        if (expectedHeader[i] === actualHeader[j]) {
          found = true;
        }
      }
      if (found) {
        break;
      }
    }

    if (!found) {
      errorColumns.push(expectedHeader[i]);
    }
  }

  if (errorColumns.length > 0) {
    return errorColumns;
  }
}

/**
 * Creates the missing column check
 * @param expectedHeader The expected header
 * @param caseSensitive Is the header case sensitive
 * @param severity The severity if the check fails
 */
function getMissingColumnCheck(expectedHeader, caseSensitive, severity) {
  return function (content) {
    let actualHeader;
    if (caseSensitive) {
      actualHeader = content;
    } else {
      actualHeader = arrayToUpperCase(content);
      expectedHeader = arrayToUpperCase(expectedHeader);
    }

    // the header must have all the expected columns but may have more
    let err = _missingColumns(expectedHeader, actualHeader);
    if (err) {
      return {
        errorCode: "CHECK_HEADER_MISSING_COLUMNS",
        severity: severity,
        message:
          "The following columns are missing in the header: [" +
          err.join() +
          "]"
      };
    }
  };
}

/**
 * Creates the mandatory column check. This is every time case sensitive as we used the associated column names.
 * @param mandatoryColumns The mandatory columns. BUT these are the associated fieldnames, not the original column names
 * @param severity The severity if the check fails
 */

function getMandatoryColumnCheck(mandatoryColumns, severity) {
  /**
   * @param the coluns found and matched.
   */
  return function (foundColumns) {
    // the header must have all the expected columns but may have more
    let err = _missingColumns(mandatoryColumns, foundColumns);
    if (err) {
      return {
        errorCode: "CHECK_HEADER_MANDATORY_COLUMNS",
        severity: severity,
        message:
          "The following columns are missing in the header and are mandatory: [" +
          err.join() +
          "]"
      };
    }
  };
}

/**
 * Creates the additional column check. Additional columns not allowed
 * @param expectedHeader The expected header
 * @param caseSensitive Is the header case sensitive
 * @param severity The severity if the check fails
 */
function getAdditionalColumnCheck(expectedHeader, caseSensitive, severity) {
  return function (content) {
    let actualHeader;
    if (caseSensitive) {
      actualHeader = content;
    } else {
      actualHeader = arrayToUpperCase(content);
      expectedHeader = arrayToUpperCase(expectedHeader);
    }

    // the header must have all the expected columns but may have more
    let err = additionalColumns(expectedHeader, actualHeader);
    if (err) {
      return {
        errorCode: "CHECK_HEADER_ADDITIONAL_COLUMNS",
        severity: severity,
        message:
          "The following columns must not be in the header: [" +
          err.join() +
          "]"
      };
    }
  };
}

function LineHeaderFactory(opts, validate) {
  return new LineHeader(opts, validate);
}

export { LineHeaderFactory };
