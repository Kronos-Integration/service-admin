/**
 * This module will turn an array of tokens into an object.
 */

import { Transform } from "stream";

export class Tokens2Object extends Transform {
  /**
   * Creates the line tokenizer and sets the options.
   * The following options are supported:
   * {
   *	"header" : ['a', 'b', 'c', undefined, 'e'],
   *  "strict" : false,
   *  "severity" : 'skip_record',
   *  "skip_first_row" : true
   * }
   *
   */
  constructor(opts = {}) {
    // call the constructor of Transform
    super({
      objectMode: true,
      highWaterMark: 16
    });

    // Set the header to be used to turn the tokens into objects
    // If no header is set, it will register a listener for the header event on the stream
    if (opts.header) {
      this.header = opts.header;
    }

    // If strict is true the count of tokens must alwas be the count of header columens.
    // other wise an error object will be thrown
    if (opts.strict !== undefined) {
      this.strict = opts.strict;
    } else {
      this.strict = false;
    }

    if (opts.severity) {
      this.severity = opts.severity;
    } else {
      this.severity = "skip_record";
    }

    // Normally the first row is the header and would be skipped
    if (opts.skip_first_row !== undefined) {
      this.skipFirstRow = opts.skip_first_row;
    } else {
      this.skipFirstRow = true;
    }
  }

  /**
   * Reads the stream data and split it into lines.
   */
  _transform(data, enc, cb) {
    if (data.lineNumber === 0) {
      if (data.header) {
        if (!this.header) {
          this.header = data.header;
        }
        // if the first row contain a header element. Skip first row will be set to true automatically.
        this.skipFirstRow = true;
      }
    }

    if (!this.header) {
      throw "Error: No header for transformation available.";
    }

    if (this.skipFirstRow) {
      // The first row usually contains the header and could be skipped
      if (data.lineNumber === 0) {
        cb();
        return;
      }
    }

    if (this.strict) {
      // Check that the length of the header is the same for the tokens
      if (this.header.length !== data.data.length) {
        addError(data, {
          errorCode: "TOKENS_2_OBJECT_STRICT_CHECK",
          severity: this.severity,
          message: `Column count missmatch: The header has ${this.header.length} columns and the row has ${data.data.length} columns.`
        });
      }
    }

    // transform the array of tokens into an object
    let obj = {};
    for (let i = 0; i < this.header.length; i++) {
      let name = this.header[i];
      if (name) {
        if (i < data.data.length) {
          obj[name] = data.data[i];
        }
      }
    }

    // replace the token array with the object data
    data.data = obj;

    this.push(data);
    cb();
  } // end transform
}

/**
 * Adds an error to the stream data
 * @param data The current stream data
 * @param error The error to be added.
 */
function addError(data, error) {
  if (!data.error) {
    data.error = [];
  }
  error.lineNumber = data.lineNumber;
  data.error.push(error);
}

export function Tokens2ObjectFactory(opts) {
  return new Tokens2Object(opts);
}
