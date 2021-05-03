#!/usr/bin/env node

import path from 'path';
import yaml from 'yaml';
import { Command } from 'commander';
import signale from 'signale';
import fs from 'fs';
import tempy from 'tempy';
import childProcess from 'child_process';
import makeDefaultFile from './utils/makeDefaultFile';
import addPlaceholders from './utils/addPlaceholders';
import encryptConfiguration from './utils/encryptConfiguration';
import { loadSecrets } from '.';

const program = new Command();

program.version(require('../package.json').version);

program
	.command('start <file> [script...]')
	.allowUnknownOption()
	.description(
		'runs a command after loading scoob configuration into the environment',
	)
	.action(async (file, script) => {
		const filePath = path.resolve(process.cwd(), file);
		if (!fs.existsSync(filePath)) {
			signale.fatal('Could not find ');
			process.exit(1);
		}

		const configuration: any = await loadSecrets(filePath);

		try {
			childProcess.execSync(script.join(' '), {
				env: {
					...process.env,
					...configuration,
				},
				stdio: 'inherit',
			});
		} catch (e) {
			process.exit(e.status);
		}
	});

program
	.command('<file>', {
		isDefault: true,
	})
	.description('create or edit a scoob configuration file')
	.option('-e, --edit', 'edit the configuration file')
	.option('-c, --create', 'create a configuration file')
	.action(async ({ edit, create }, [file]) => {
		if (!process.env.EDITOR) {
			signale.fatal(
				'You must define your $EDITOR environemnt variable to use Scoob.',
			);
			process.exit(1);
		}

		if (!create && !edit) {
			signale.warn(
				'Neither create nor edit mode was provided. Scoob will attempt to automatically determine the correct mode.',
			);
		}

		if (create && edit) {
			signale.fatal('You cannot provide both create and edit mode.');
			process.exit(1);
		}

		const filePath = path.resolve(process.cwd(), file);
		if (fs.existsSync(filePath) && create) {
			signale.fatal(
				'The create flag was provided, but the secrets file already exists.',
			);
			process.exit(1);
		}
		if (!fs.existsSync(filePath) && edit) {
			signale.fatal(
				'The edit flag was provided, but the secrets file does not exist.',
			);
			process.exit(1);
		}

		const isCreating =
			create || (!create && !edit && !fs.existsSync(filePath));

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
			childProcess.spawnSync(process.env.EDITOR, [tempFile], {
				stdio: 'inherit',
			});
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

		signale.success(
			`Wrote ${
				isCreating ? 'new' : 'updated'
			} configuration file to ${file}`,
		);
	});

program.parse(process.argv);
