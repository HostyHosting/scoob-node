import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import { decryptMessage } from './enterpriseGrade/crypto';

const { keys, configuration } = yaml.parse(
	fs.readFileSync(path.resolve(__dirname, '../secrets.yml'), 'utf-8'),
);

console.log(
	Object.fromEntries(
		Object.entries(configuration).map(([key, value]) => [
			key,
			decryptMessage(
				Buffer.from(keys.publicKey, 'hex'),
				Buffer.from(keys.secretKey, 'hex'),
				value as string,
			),
		]),
	),
);

// export function loadSecretsIntoEnv(path: string) {
// }
