import sodium from 'sodium-native';
import { Providers } from '../constants';

function generateKeys() {
	const publicKey = sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES);
	const secretKey = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES);
	sodium.crypto_box_keypair(publicKey, secretKey);
	return [publicKey, secretKey] as const;
}

export default function makeDefaultFile() {
	const [publicKey, secretKey] = generateKeys();

	const file = {
		configuration: {
			exampleKey: 'some value that should be encrypted',
		},
		keys: {
			exampleKey: {
				provider: Providers.ENV,
				publicKey: publicKey.toString('hex'),
				secretKey: secretKey.toString('hex'),
			},
		},
	};

	return file;
}
