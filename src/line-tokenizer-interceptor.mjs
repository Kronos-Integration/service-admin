/* jslint node: true, esnext: true */
'use strict';

import {
	Interceptor
}
from "@kronos-integration/interceptor";

import {
	parserFactory
}
from './line-tokenizer';

/**
 * This interceptor cares about the handling of the messages.
 * It will add the hops and copies the messages
 */
export default class LineTokenizerInterceptor extends Interceptor {

	static get name() {
		return 'line-tokenizer-csv';
	}

	receive(request, oldRequest) {
		if (request.payload) {
			const streamFilter = parserFactory(this.config.config, true);
			const stream = request.payload;
			request.payload = stream.pipe(streamFilter);
		}
		return this.connected.receive(request, oldRequest);
	}
}
