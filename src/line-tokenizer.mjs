/* jslint node: true, esnext: true */
'use strict';

/**
 * This module reads an object stream which contains a string data field.
 * It will split this string into tokens
 */
const stream = require('stream');

const DEFAULT_QUOTE = '"';

// Defines the default delimiter list
const DEFAULT_SEPARATOR_LIST = [",", ";", "\t"];

class LineTokenizerCsv extends stream.Transform {

	/**
	 * Creates the line tokenizer and sets the options.
	 * The following options are supported:
	 * {
	 *	"separator_list" : [',', ';'],
	 *  "quote_char" : '"',
	 *  "use_quotes" : true,
	 *  "trim" : true
	 * }
	 *
	 */
	constructor(opts) {
		// call the constrctor of stream.Transform
		super({
			objectMode: true,
			highWaterMark: 16
		});

		if (!opts) opts = {};


		// Set the list of valid field separators
		if (opts.separatorList) {
			this.separatorList = opts.separatorList;
		} else {
			this.separatorList = DEFAULT_SEPARATOR_LIST;
		}

		// Set the quote character
		if (opts.quote_char) {
			this.quote = opts.quote_char;
		} else {
			this.quote = DEFAULT_QUOTE;
		}

		// Should the field content be trimmed
		if (opts.trim !== undefined) {
			this.trim = opts.trim;
		} else {
			this.trim = true;
		}

		// use quotes: If set to false, quotes will be handles as normal character
		if (opts.use_quotes !== undefined) {
			this.useQuotes = opts.use_quotes;
		} else {
			this.useQuotes = true;
		}

		this.separator = undefined; // The separator found and used
	}


	/**
	 * Reads the stream data and split it into lines.
	 */
	_transform(data, enc, cb) {
			let inQuotes = false; // if we are in a quoted part, this is set to true
			let tokens = []; // The generated tokens
			let stringData = data.data; // The data from the request
			let lineNumber = data.lineNumber; // The curent line number
			let lastEnd = 0; // The end of the last token

			if (lineNumber === 0) {
				// every time starting with line 0 reset the separator
				this.separator = undefined;
			}

			for (let i = 0; i < stringData.length; i++) {

				if (this.useQuotes) {
					// Yes quotes should be considered
					if (stringData.charAt(i) === this.quote) {
						if (i < stringData.length - 1 && stringData.charAt(i + 1) === this.quote) {
							i++; // ""
							// add the one '"'
						} else {
							inQuotes = !inQuotes;
						}
						continue;
					}
				}

				if (this.separator) {
					// We already have a separator
					if (stringData.charAt(i) === this.separator && !inQuotes) {
						tokens.push(stringData.slice(lastEnd, i));
						lastEnd = i + 1;
					}
				} else {
					// no delimiter until now. Probe for all the possible ones
					for (let j = 0; j < this.separatorList.length; j++) {
						let separator = this.separatorList[j];
						if (stringData.charAt(i) === separator && !inQuotes) {
							tokens.push(stringData.slice(lastEnd, i));
							lastEnd = i + 1;
							this.separator = separator;
							break;
						}
					}
				}

			}

			// The last field or if the string has only one field
			if (lastEnd < stringData.length) {
				tokens.push(stringData.slice(lastEnd, stringData.length));
			}

			// should the tokens be trimmed?
			if (this.trim) {
				for (let i = 0; i < tokens.length; i++) {
					if (tokens[i]) {
						tokens[i] = tokens[i].trim();
					}
				}
			}

			// remove the quotes
			if (this.useQuotes) {
				for (let i = 0; i < tokens.length; i++) {
					if (tokens[i] && tokens[i].charAt(0) === this.quote && tokens[i].charAt(tokens[i].length - 1) === this.quote) {
						tokens[i] = tokens[i].slice(1, tokens[i].length - 1);
					}
					let re = new RegExp(this.quote + this.quote, 'g');
					tokens[i] = tokens[i].replace(re, this.quote);
				}
			}

			data.data = tokens;

			this.push(data);
			cb();
		} // end transform

}

function parserFactory(opts) {
	return new LineTokenizerCsv(opts);
}

export {
	parserFactory
};
