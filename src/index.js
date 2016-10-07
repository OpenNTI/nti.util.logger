import logger from 'debug';

const defaultPattern = ['info', 'error', 'warn'].map(x => `*:${x}`).join(',');
const pattern = logger.load();
if (!pattern || !process.browser) {
	logger.enable(pattern || defaultPattern);
}

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
		return localStorage.getItem(`nti-logger.${key}`);
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


	constructor (name) {
		for (let key of ['info', 'error', 'warn', 'debug']) {
			this[key] = logger(`${name}:${key}`);
			this[key].color = COLORS[key];
		}


		if (process.browser) {

			const getLog = lvl => {
				const f =  console[getLogMethod(lvl)] || console[lvl];
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
