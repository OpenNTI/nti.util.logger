import logger from 'debug';

const pattern = logger.load() || ['info', 'error', 'warn'].map(x => `*:${x}`).join(',');
if (!process.browser) {
	logger.enable(pattern);
}

const COLORS = {
	'error': process.browser ? 'crimson' : 1, //red
	'info': process.browser ? 'forestgreen' : 2, //green
	'warn': process.browser ? 'goldenrod' : 3, //yellow/orange
	'debug': process.browser ? 'dodgerblue' : 4 //blue
	//'': browser ? 'darkorchid' : 5, //magenta
	//'': browser ? 'lightseagreen' : 6, //lightblue
};

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


	static enable (it) {
		const find = (o, map) => Object.keys(map).reduce((found, i) => found || (map[i] === o && i), null);

		const pattern = it == null ? '*'
						: typeof it === 'string' ? it
						: find(it, this.loggers);

		if (pattern) {
			logger.enable(pattern);
		}
	}


	constructor (name) {
		for (let key of ['info', 'error', 'warn', 'debug']) {
			this[key] = logger(`${name}:${key}`);
			this[key].color = COLORS[key];
		}


		if (process.browser) {
			const getLog = lvl => {
				const f =  console[console.trace && /Chrome\//.test(navigator.userAgent) ? 'trace' : lvl];
				return f ? f.bind(console) : console.log.bind(console);
			};
			this.error.log = getLog('error');
			this.warn.log = getLog('warn');
			this.debug.log = getLog('debug');
			this.info.log = getLog('log');
		}

		this.name = name;
		this.log = this.info;
	}
}
