import Logger from '../index';

describe('Logger', () => {

	it('should be defined and expose a getter method', () => {
		expect(Logger).toBeTruthy();
		expect(typeof Logger.get).toBe('function');
	});

});
