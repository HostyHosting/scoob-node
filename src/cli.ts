#!/usr/bin/env node
import path from 'path';
import yaml from 'yaml';
import yargs from 'yargs';
import signale from 'signale';
import fs from 'fs';
import tempy from 'tempy';
import childProcess from 'child_process';
import { encryptMessage, generateKeys } from './enterpriseGrade/crypto';

const PLACEHOLDER = '<encrypted>';

function makeDefaultFile() {
	const [publicKey, secretKey] = generateKeys();

	const file = {
		configuration: {
			exampleKey: 'some value that should be encrypted',
		},
		keys: {
			publicKey: publicKey.toString('hex'),
			secretKey: secretKey.toString('hex'),
		},
	};

	return file;
}

type EncryptableFile = {
	configuration: Record<string, string>;
	keys: {
		publicKey: string;
		privateKey: string;
	};
};

function encryptObject(
	{ configuration, keys }: EncryptableFile,
	originalConfiguration: Record<string, string>,
) {
	const encryptedConfiguration = Object.fromEntries(
		Object.entries(configuration).map(([key, value]) => {
			if (value === PLACEHOLDER) {
				if (!originalConfiguration[key]) {
					throw new Error('moving encrypted values is not supported');
				}

				return [key, originalConfiguration[key]];
			} else {
				return [
					key,
					encryptMessage(Buffer.from(keys.publicKey, 'hex'), value),
				];
			}
		}),
	);

	return {
		configuration: encryptedConfiguration,
		keys,
	};
}

function addPlaceholders({ keys, configuration }: EncryptableFile) {
	return {
		configuration: Object.fromEntries(
			Object.entries(configuration).map(([key, value]) => [
				key,
				PLACEHOLDER,
			]),
		),
		keys,
	};
}

yargs
	.scriptName('scoob')
	.usage('Usage: $0 --create ./path-to-secrets.yml')
	.command(
		'$0 <file>',
		'Encrypt secrets to a provided yaml file. If neither --create or --edit is provided, it will automatically detect which mode to use.',
		(yargs) =>
			yargs
				.option('create', {
					alias: 'c',
					type: 'boolean',
					description: 'Create a new encrypted secrets file',
				})
				.option('edit', {
					alias: 'e',
					type: 'boolean',
					description: 'Edit an existing secrets file',
				})
				.positional('file', { type: 'string', demandOption: true }),
		(argv) => {
			if (!process.env.EDITOR) {
				signale.fatal(
					'You must define your $EDITOR environemnt variable to use Scoob.',
				);
				process.exit(1);
			}

			if (!argv.create && !argv.edit) {
				signale.warn(
					'Neither create nor edit mode was provided. Scoob will attempt to automatically determine the correct mode.',
				);
			}

			if (argv.create && argv.edit) {
				signale.fatal('You cannot provide both create and edit mode.');
				process.exit(1);
			}

			const filePath = path.resolve(process.cwd(), argv.file);
			if (fs.existsSync(filePath) && argv.create) {
				signale.fatal(
					'The create flag was provided, but the secrets file already exists.',
				);
				process.exit(1);
			}
			if (!fs.existsSync(filePath) && argv.edit) {
				signale.fatal(
					'The edit flag was provided, but the secrets file does not exist.',
				);
				process.exit(1);
			}

			const isCreating =
				argv.create ||
				(!argv.create && !argv.edit && !fs.existsSync(filePath));

			const tempFile = tempy.file({ name: 'new-config.yml' });

			const originalContents = isCreating
				? makeDefaultFile()
				: yaml.parse(fs.readFileSync(filePath, 'utf-8'));

			const tempFileContents = addPlaceholders(originalContents);

			fs.writeFileSync(tempFile, yaml.stringify(tempFileContents));

			// In case the editor throws, just ignore it.
			try {
				childProcess.execSync(`${process.env.EDITOR} ${tempFile}`);
			} catch {}

			const newFileContents = fs.readFileSync(tempFile, 'utf-8');
			const objectToEncrypt = yaml.parse(newFileContents);

			const encryptedObject = encryptObject(
				objectToEncrypt,
				originalContents.configuration,
			);

			fs.writeFileSync(filePath, yaml.stringify(encryptedObject));

			// Attempt to unlink the file after a little bit of time to ensure all file handles are closed.
			setTimeout(() => {
				try {
					fs.unlinkSync(tempFile);
				} catch {}
			}, 500);
		},
	)
	.demandCommand(1).argv;
