import { getActiveCauldron } from 'ern-cauldron-api';
import { AppVersionDescriptor, BundleStoreSdk, config, log } from 'ern-core';
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../../lib';
import { Argv } from 'yargs';
import untildify from 'untildify';

export const command = 'use <accessKey>';
export const desc = 'Use an existing store given its access key';

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', (d) => AppVersionDescriptor.fromString(d))
    .coerce('pathToBinary', (p) => untildify(p))
    .epilog(epilog(exports));
};

export const commandHandler = async ({ accessKey }: { accessKey: string }) => {
  await logErrorAndExitIfNotSatisfied({
    bundleStoreUrlSetInCauldron: {
      extraErrorMessage: `You should add bundleStore config in your Cauldron`,
    },
  });

  const cauldron = await getActiveCauldron();
  const bundleStoreUrl = (await cauldron.getBundleStoreConfig()).url;
  const sdk = new BundleStoreSdk(bundleStoreUrl);

  const store = await sdk.getStoreByAccessKey({ accessKey });
  config.set('bundlestore-id', store);
  config.set('bundlestore-accesskey', accessKey);

  log.info(`Now using store ${store}`);
};

export const handler = tryCatchWrap(commandHandler);
