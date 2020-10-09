import { PLACEHOLDER } from '../constants';
import isObject from './isObject';

export default function addPlaceholders<T extends object>(object: T): T {
	return Object.fromEntries(
		Object.entries(object).map(([key, value]) => [
			key,
			isObject(value) ? addPlaceholders(value) : PLACEHOLDER,
		]),
	) as T;
}
