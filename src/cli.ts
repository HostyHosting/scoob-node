#!/usr/bin/env node

import path from 'path';
import yaml from 'yaml';
import yargs from 'yargs';
import signale from 'signale';
import fs from 'fs';
import tempy from 'tempy';
import childProcess from 'child_process';
import makeDefaultFile from './utils/makeDefaultFile';
import addPlaceholders from './utils/addPlaceholders';
import encryptConfiguration from './utils/encryptConfiguration';

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
		async (argv) => {
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

			const tempFileContents = {
				configuration: isCreating
					? originalContents.configuration
					: addPlaceholders(originalContents.configuration),
				keys: originalContents.keys,
			};

			fs.writeFileSync(tempFile, yaml.stringify(tempFileContents));

			// In case the editor throws, just ignore it.
			try {
				childProcess.execSync(`${process.env.EDITOR} ${tempFile}`);
			} catch {}

			const newFileText = fs.readFileSync(tempFile, 'utf-8');
			const newFile = yaml.parse(newFileText);

			const encryptedConfiguration = await encryptConfiguration(
				newFile.keys,
				newFile.keys.default,
				newFile.configuration,
				originalContents.configuration,
			);

			fs.writeFileSync(
				filePath,
				yaml.stringify({
					configuration: encryptedConfiguration,
					keys: newFile.keys,
				}),
			);

			// Attempt to unlink the temp file after a little bit of time to ensure all file handles are closed.
			setTimeout(() => {
				try {
					fs.unlinkSync(tempFile);
				} catch {}
			}, 500);
		},
	)
	.demandCommand(1).argv;
