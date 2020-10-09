import { Providers } from './constants';

export type Provider = {
	encrypt(keys: unknown, decrypted: string): Promise<string> | string;
	decrypt(keys: unknown, encrypted: string): Promise<string> | string;
};

export interface Configuration {
	[property: string]: string | Configuration;
}

export type KeyConfigurationValue = Record<string, any> & {
	provider: Providers;
};

export interface KeyConfiguration {
	[property: string]: KeyConfigurationValue | KeyConfiguration;
}

export type EncryptableFile = {
	configuration: Configuration;
	keys: KeyConfiguration;
};
