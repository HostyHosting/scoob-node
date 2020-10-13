import sodium from 'sodium-native';
import { Provider } from '../types';

type Keys = {
	publicKey: string;
	secretKey: string;
};

function resolveKey(text: string) {
	if (text.startsWith('$')) {
		const envVar = text.slice(1);
		text = process.env[envVar]!;
		if (!text) {
			throw new Error(
				`Expected to find environment variable "${envVar}", but did not find one.`,
			);
		}
	}
	return Buffer.from(text, 'hex');
}

export class EnvProvider implements Provider {
	encrypt(keys: Keys, decrypted: string) {
		const message = Buffer.from(decrypted, 'utf-8');
		const ciphertext = Buffer.alloc(
			sodium.crypto_box_SEALBYTES + message.length,
		);

		sodium.crypto_box_seal(ciphertext, message, resolveKey(keys.publicKey));

		return ciphertext.toString('base64');
	}

	decrypt(keys: Keys, encrypted: string) {
		const ciphertext = Buffer.from(encrypted, 'base64');
		const decrypted = Buffer.alloc(
			ciphertext.length - sodium.crypto_box_SEALBYTES,
		);

		sodium.crypto_box_seal_open(
			decrypted,
			ciphertext,
			resolveKey(keys.publicKey),
			resolveKey(keys.secretKey),
		);

		return decrypted.toString('utf-8');
	}
}
