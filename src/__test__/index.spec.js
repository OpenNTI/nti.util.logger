/* eslint-disable no-console */
/* eslint-env jest */
import Logger, { quietFormat } from '../index.js';

describe('Logger', () => {
	test('should be defined and expose a getter method', () => {
		expect(Logger).toBeTruthy();
		expect(typeof Logger.get).toBe('function');
	});

	test('console is suppressed while formatting', () => {
		jest.spyOn(console, 'warn');

		const o = {
			foo: '',
			toJSON() {
				console.warn('gotcha!');
				return { meh: 'value' };
			},
		};

		expect(quietFormat('Test: %j', o)).toMatchInlineSnapshot(
			`"Test: {\\"meh\\":\\"value\\"}"`
		);
		expect(console.warn).not.toHaveBeenCalled();
	});
});
