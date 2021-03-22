/* eslint-disable no-console */
import util from 'util';

import debug from 'debug';

const defaultPattern = ['info', 'error', 'warn'].map(x => `*:${x}`).join(',');

const COLORS = {
	error: process.browser ? 'crimson' : 1, //red
	info: process.browser ? 'forestgreen' : 2, //green
	warn: process.browser ? 'goldenrod' : 3, //yellow/orange
	debug: process.browser ? 'dodgerblue' : 4, //blue
	//'': browser ? 'darkorchid' : 5, //magenta
	//'': browser ? 'lightseagreen' : 6, //lightblue
};

let Sentry = null;

export default class Logger {
	static injectSentry(sentry) {
		Sentry = sentry;
	}

	static get(name) {
		const cache = (this.loggers = this.loggers || {});

		if (!cache[name]) {
			cache[name] = new Logger(name);
		}

		return cache[name];
	}

	static quiet() {
		debug.disable();
	}

	constructor(name) {
		if (!Logger.init) {
			Logger.init = true;

			const pattern = debug.load();
			if (
				(!pattern && process.env.NODE_ENV !== 'production') ||
				!process.browser
			) {
				debug.enable(pattern || defaultPattern);
			}
		}

		for (let key of ['info', 'error', 'warn', 'debug']) {
			this[key] = logger(`${name}:${key}`);
		}

		this.name = name;
		this.log = this.info;
	}
}

function getConsoleWriter(lvl) {
	function getLocalValue(key) {
		try {
			return global.localStorage.getItem(`nti-logger.${key}`);
		} catch (e) {
			return null;
		}
	}
	const getLogMethod = x => getLocalValue(x) || x;
	const method = console[getLogMethod(lvl)] || console[lvl];
	const writer = method ? method.bind(console) : console.log.bind(console);

	return writer;
}

function logger(namespace, level) {
	const category = debug(namespace);
	category.color = COLORS[level];

	if (process.browser) {
		category.log = getConsoleWriter('error');
	}

	return (...args) => {
		if (!category.enabled && Sentry) {
			Sentry.addBreadcrumb({
				category: 'debug',
				timestamp: new Date(),
				message: util.format(...args),
				level: level || 'info',
			});
		}
		category(...args);
	};
}
