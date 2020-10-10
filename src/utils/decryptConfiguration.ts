import {
	Configuration,
	KeyConfiguration,
	KeyConfigurationValue,
} from '../types';
import getProvider from './getProvider';
import isObject from './isObject';

export default async function decryptConfiguration(
	keys: KeyConfiguration,
	defaultKey: KeyConfigurationValue | undefined,
	configuration: Configuration,
) {
	const entryPromises = Object.entries(configuration).map(
		async ([key, value]) => {
			// Note: We keep this as `any` intentionally to make this easier for us.
			const keyConfiguration = (keys[key] || defaultKey) as any;
			const provider = getProvider(keyConfiguration);
			if (isObject(value)) {
				return [
					key,
					await decryptConfiguration(keys[key], defaultKey, value),
				];
			} else {
				return [key, await provider.decrypt(keyConfiguration, value)];
			}
		},
	);

	const encryptedConfiguration: Configuration = Object.fromEntries(
		await Promise.all(entryPromises),
	);

	return encryptedConfiguration;
}
