/* eslint-disable no-console */
import util from 'util';

import debug from 'debug';

const defaultPattern = ['info', 'error', 'warn'].map(x => `*:${x}`).join(',');

const COLORS = {
	error: process.browser ? 'crimson' : 1, //red
	info: process.browser ? 'forestgreen' : 2, //green
	warn: process.browser ? 'goldenrod' : 3, //yellow/orange
	debug: process.browser ? 'dodgerblue' : 4, //blue
	trace: process.browser ? 'darkorchid' : 5, //magenta
	//'': process.browser ? 'lightseagreen' : 6, //lightblue
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

		for (let key of ['info', 'error', 'warn', 'debug', 'trace']) {
			this[key] = logger(`${name}:${key}`);
		}

		this.name = name;
		this.log = this.info;

		this.stack = error => {
			error = error || 'Not Given';
			this.error(error.stack || error.message || error);
			if (Sentry) {
				Sentry.captureException(error);
			}
		};
	}
}

function getConsoleWriter(lvl) {
	if (lvl === 'trace') {
		lvl = 'error';
	}
	const method = console[lvl] || console.debug;
	const writer = method.bind(console);
	return writer;
}

function logger(namespace, level) {
	const category = debug(namespace);
	category.color = COLORS[level];

	if (process.browser) {
		category.log = getConsoleWriter(level);
	}

	return (...args) => {
		if (level !== 'trace' && !category.enabled && Sentry) {
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
