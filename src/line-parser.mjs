/**
 * This module reads a stream and split it into lines.
 * The out put stream will be an object stream
 */

import { Transform } from "stream";

const QUOTE = new Buffer('"')[0];
const CR = new Buffer("\r")[0];
const NL = new Buffer("\n")[0];

export class LineParser extends Transform {
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
  constructor(opts={}) {
    // call the constrctor of stream.Transform
    super({
      objectMode: true,
      highWaterMark: 16
    });

    // Set the line separator
    if (opts.line_separator) {
      this.newline = new Buffer(opts.line_separator)[0];
      this.customNewline = true;
    } else {
      this.newline = NL;
      this.customNewline = false;
    }

    // Is a new line allowed in a cell? In this case the cell must be in quotes
    if (opts.allow_new_line_in_cell !== undefined) {
      this.allowNewLineInCell = opts.allow_new_line_in_cell;
    } else {
      this.allowNewLineInCell = false;
    }

    // Should empty lines be skipped?
    if (opts.skip_empty_lines !== undefined) {
      this.skipEmptyLines = opts.skip_empty_lines;
    } else {
      this.skipEmptyLines = true;
    }

    // Set the quote character
    if (opts.quote_char) {
      this._quote = new Buffer(opts.quote_char)[0];
    } else {
      this._quote = QUOTE;
    }

    this._prev = null; // Stores the previous read chunk of data. This data grows until the end of the first line is reached.
    this._newLine = null; // The exrcted new line
    this._quoting = false; // if true, it means we are in a quoted field
    this._lineNumber = 0;
  }

  /**
   * Reads the stream data and split it into lines.
   */
  _transform(data, enc, cb) {
    // if the data type is a string, convert it to a Buffer
    if (typeof data === "string") data = new Buffer(data);

    let start = 0;
    let buf = data;

    if (this._prev) {
      // There is data from a previous read. Add it to the buffer and set the start value to the start of the new data
      start = this._prev.length;
      buf = Buffer.concat([this._prev, data]);
      this._prev = null;
    }

    // iterate the new chunk of data
    for (let i = start; i < buf.length; i++) {
      if (this.allowNewLineInCell) {
        // Only in this case we need to care about the quotes
      } else {
      }

      // switch the quoting flag
      if (buf[i] === this._quote) this._quoting = !this._quoting;

      // TODO quoting is nur interressant wenn allow line break in cell = true
      if (!this._quoting || !this.allowNewLineInCell) {
        // we are not in a quote
        if (!this.customNewline) {
          if (buf[i] === NL) {
            this.newline = NL;
          } else if (buf[i] === CR) {
            if (buf[i + 1] !== NL) {
              this.newline = CR;
            }
          }
        }

        if (buf[i] === this.newline) {
          if (buf[i - 1] === CR) {
            this._pushLine(buf.slice(this._prevEnd, i - 1)); // -1 we do not need the CR and new line
          } else {
            this._pushLine(buf.slice(this._prevEnd, i)); // -1 we do not need the new line
          }
          this._prevEnd = i + 1;
        }
      }
    }

    if (this._prevEnd === buf.length) {
      this._prevEnd = 0;
      return cb();
    }

    if (buf.length - this._prevEnd < data.length) {
      this._prev = data;
      this._prevEnd -= buf.length - data.length;
      return cb();
    }

    this._prev = buf;
    cb();
  } // end transform

  /**
   * Returns the rest as line
   */
  _flush(cb) {
    if (this._quoting || !this._prev) return cb();
    this._pushLine(this._prev.slice(this._prevEnd));
    this._lineNumber = 0;
    cb();
  }

  /**
   * Pushes a line object onto the stream
   */
  _pushLine(data) {
    let stringData = data.toString("utf-8");
    let obj;

    if (this.skipEmptyLines) {
      if (!stringData.match(/^\s*$/)) {
        // not empty
        obj = {
          lineNumber: this._lineNumber,
          data: stringData
        };
      }
    } else {
      obj = {
        lineNumber: this._lineNumber,
        data: stringData
      };
    }

    if (obj) {
      this.push(obj);
    }
    this._lineNumber++;
  }
}
