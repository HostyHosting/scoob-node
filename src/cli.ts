#!/usr/bin/env node
import path from 'path';
import yargs from 'yargs';
import signale from 'signale';
import fs from 'fs';
import { sign } from 'crypto';

const { argv } = yargs
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

			// DO THINGS
		},
	)
	.demandCommand(1);
