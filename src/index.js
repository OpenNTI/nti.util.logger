/* eslint-disable no-console */
import logger from 'debug';

const defaultPattern = ['info', 'error', 'warn'].map(x => `*:${x}`).join(',');

const COLORS = {
	'error': process.browser ? 'crimson' : 1, //red
	'info': process.browser ? 'forestgreen' : 2, //green
	'warn': process.browser ? 'goldenrod' : 3, //yellow/orange
	'debug': process.browser ? 'dodgerblue' : 4 //blue
	//'': browser ? 'darkorchid' : 5, //magenta
	//'': browser ? 'lightseagreen' : 6, //lightblue
};

const getLogMethod = x => getLocalValue(x) || x;

function getLocalValue (key) {
	try {
		return global.localStorage.getItem(`nti-logger.${key}`);
	} catch (e) {
		return null;
	}
}

export default class Logger {

	static get (name) {
		const cache = this.loggers = this.loggers || {};

		if (!cache[name]) {
			cache[name] = new Logger(name);
		}

		return cache[name];
	}

	static quiet () {
		logger.disable();
	}

	onFirstCall (f) {

		return (...args) => {

			if (!Logger.called) {
				Logger.called = true;

				const pattern = logger.load();
				if ((!pattern && process.env.NODE_ENV !== 'production') || !process.browser) {
					logger.enable(pattern || defaultPattern);
				}
			}

			return f.apply(this, args);
		};
	}

	getConsoleWriter (lvl) {
		// Internet Explorer 6-11 (testing conditional execution of comment)
		const isIE = /*@cc_on!@*/false || !!global.document.documentMode;
		const method =  console[getLogMethod(lvl)] || console[lvl];
		const writer = method ? method.bind(console) : console.log.bind(console);

		const filter = (o) => o && o.toJSON ? o.toJSON() : o;

		return !isIE ? writer : (...args) =>
			writer.apply(console, args.map(o => typeof o !== 'object' ? o : filter(o)));
	}

	constructor (name) {
		for (let key of ['info', 'error', 'warn', 'debug']) {
			this[key] = logger(`${name}:${key}`);
			this[key].color = COLORS[key];
		}


		if (process.browser) {
			this.error.log = this.getConsoleWriter('error');
			this.warn.log = this.getConsoleWriter('warn');
			this.debug.log = this.getConsoleWriter('debug');
			this.info.log = this.getConsoleWriter('log');
		}

		this.name = name;
		this.log = this.info;

		for (let f of Object.keys(this)) {
			if (this[f] && typeof this[f] === 'function') {
				this[f] = this.onFirstCall(this[f]);
			}
		}
	}
}
