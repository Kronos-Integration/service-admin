/**
 * Transforms an object stream into a stream of strings
 */

import { Transform } from 'stream';

export class Obj2String extends Transform {
  /**
   * Creates the line parser and sets the options.
   * The following options are supported:
   * {
   *	"allow_new_line_in_cell" : true,
   * 	"line_separator" : "\n",
   *  "quote_char" : '"'
   *  "skip_empty_lines" : true
   * }
   *
   */
  constructor(opts = {}) {
    super({
      objectMode: true,
      highWaterMark: 16
    });
  }

  /**
   * Reads the stream data and split it into lines.
   */
  _transform(data, enc, next) {
    // if the data type is a string, convert it to a Buffer
    if (typeof data !== 'string') {
      data = JSON.stringify(data) + '\n';
    }

    this.push(data);
    next();
  }
}
