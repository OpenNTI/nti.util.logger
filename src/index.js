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
	/**
	 * Enable reporting errors to sentry through the logger.
	 * This should be called once at application initialization.
	 *
	 * @param {Sentry} sentry Sentry instance.
	 */
	static injectSentry(sentry) {
		Sentry = sentry;
	}

	/**
	 * @param {string} name
	 * @returns {Logger}
	 */
	static get(name) {
		const cache = (this.loggers = this.loggers || {});

		if (!cache[name]) {
			cache[name] = new Logger(name);
		}

		return cache[name];
	}

	/**
	 * Disable all logging.
	 */
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
			this[key] = logger(`${name}:${key}`, key);
		}

		/**
		 * @property {string} name Logger key
		 */
		this.name = name;

		/**
		 * @alias {this.info}
		 */
		this.log = this.info;

		/**
		 * Log a stack trace at error level, while also reporting the error to Sentry
		 *
		 * @param {Error} error
		 */
		this.stack = error => {
			error = error || 'Not Given';
			this.error(error.stack || error.message || error);
			if (Sentry) {
				Sentry.captureException(error);
			}
		};
	}

	/**
	 * Log a message at debug level.
	 *
	 * Level: trace => debug => info => warn => error
	 *
	 * @param {string|any} message
	 * @param  {...any} args
	 */
	debug(message, ...args) {
		/* implemented in constructor, this exists only for type-def documentation */
	}

	/**
	 * Log a message at info.
	 *
	 * Level: trace => debug => info => warn => error
	 *
	 * @param {string|any} message
	 * @param  {...any} args
	 */
	info(message, ...args) {
		/* implemented in constructor, this exists only for type-def documentation */
	}

	/**
	 * Log a message at error level.
	 *
	 * Level: trace => debug => info => warn => error
	 *
	 * @param {string|any} message
	 * @param  {...any} args
	 */
	error(message, ...args) {
		/* implemented in constructor, this exists only for type-def documentation */
	}

	/**
	 * Log a message at warning level.
	 *
	 * Level: trace => debug => info => warn => error
	 *
	 * @param {string|any} message
	 * @param  {...any} args
	 */
	warn(message, ...args) {
		/* implemented in constructor, this exists only for type-def documentation */
	}

	/**
	 * Log a message at trace level.
	 *
	 * Level: trace => debug => info => warn => error
	 *
	 * @param {string|any} message
	 * @param  {...any} args
	 */
	trace(message, ...args) {
		/* implemented in constructor, this exists only for type-def documentation */
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
			if (typeof args[0] === 'string') {
				args[0] = args[0].replace(/%o/gi, '%j');
			}
			Sentry.addBreadcrumb({
				category: 'debug',
				timestamp: new Date(),
				message: quietFormat(...args),
				level: level === 'warn' ? 'warning' : level || 'info',
			});
		}
		category(...args);
	};
}

// exported for testing
export function quietFormat(...args) {
	const noop = () => {};
	const c = global.console;
	let message;
	try {
		global.console = new Proxy(
			{},
			{
				get: () => noop,
			}
		);

		message = util.format(...args);
	} catch (e) {
		message = e.message ?? e;
	} finally {
		global.console = c;
	}

	return message;
}
