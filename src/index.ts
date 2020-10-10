import fs from 'fs';
import yaml from 'yaml';
import decryptConfiguration from './utils/decryptConfiguration';

export async function loadSecrets(path: string) {
	const fileContents = fs.readFileSync(path, 'utf-8');
	const fileYaml = yaml.parse(fileContents);
	return await decryptConfiguration(
		fileYaml.keys,
		fileYaml.keys.default,
		fileYaml.configuration,
	);
}

export async function loadSecretsIntoEnv(path: string) {
	const configuration = await loadSecrets(path);
	for (const [key, value] of Object.entries(configuration)) {
		// @ts-ignore: This is probably fine:
		process.env[key] = value;
	}
	return configuration;
}
