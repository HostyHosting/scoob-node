import { Providers } from '../constants';
import { EnvProvider } from '../providers/env';
import { KeyConfigurationValue, Provider } from '../types';

export default function getProvider(key: KeyConfigurationValue): Provider {
  if (!key) {
    throw new Error('Did not find encryption key configuration.');
  }

  switch (key.provider) {
    case Providers.ENV:
      return new EnvProvider();
    default:
      throw new Error('');
  }
}
