import { log, NativePlatform, PackagePath, Platform } from 'ern-core';
import { publishContainer } from 'ern-container-publisher';
import { parseJsonFromStringOrFile } from 'ern-orchestrator';
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib';
import { Argv } from 'yargs';
import untildify from 'untildify';

export const command = 'publish-container';
export const desc = 'Publish a local Container';

export const builder = (argv: Argv) => {
  return argv
    .option('containerPath', {
      describe: 'Local path to the Container to publish',
      type: 'string',
    })
    .coerce('containerPath', (p) => untildify(p))
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra publisher configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .option('inPlace', {
      default: false,
      describe:
        'Run the publisher directly from the container directory instead of a temporary directory',
      type: 'boolean',
    })
    .option('platform', {
      choices: ['android', 'ios'],
      demandOption: true,
      describe: 'The native platform of the Container',
      type: 'string',
    })
    .option('publisher', {
      alias: 'p',
      demandOption: true,
      describe: 'The publisher to use',
      type: 'string',
    })
    .coerce('publisher', PackagePath.fromString)
    .option('url', {
      alias: 'u',
      describe: 'The publication url',
      type: 'string',
    })
    .option('version', {
      alias: 'v',
      default: '1.0.0',
      describe: 'Container version to use for publication',
      type: 'string',
    })
    .epilog(epilog(exports));
};

const publisherPackagePrefix = 'ern-container-publisher-';

export const commandHandler = async ({
  containerPath,
  extra,
  inPlace,
  platform,
  publisher,
  url,
  version,
}: {
  containerPath?: string;
  extra?: string;
  inPlace?: boolean;
  platform: NativePlatform;
  publisher: PackagePath;
  url: string;
  version: string;
}) => {
  containerPath =
    containerPath || Platform.getContainerGenOutDirectory(platform);

  await logErrorAndExitIfNotSatisfied({
    isContainerPath: {
      extraErrorMessage: `Make sure that ${containerPath} is the root of a Container project`,
      p: containerPath!,
    },
  });

  let extraObj;
  try {
    extraObj = (extra && (await parseJsonFromStringOrFile(extra))) || {};
  } catch (e) {
    throw new Error('(--extra/-e option): Invalid input');
  }

  if (
    publisher.isRegistryPath &&
    !publisher.basePath.startsWith(publisherPackagePrefix)
  ) {
    publisher = publisher.version
      ? PackagePath.fromString(
          `${publisherPackagePrefix}${publisher.basePath}@${publisher.version}`,
        )
      : PackagePath.fromString(
          `${publisherPackagePrefix}${publisher.basePath}`,
        );
  }

  await publishContainer({
    containerPath,
    containerVersion: version,
    extra: extraObj,
    inPlace,
    platform,
    publisher,
    url,
  });
  log.info('Container published successfully');
};

export const handler = tryCatchWrap(commandHandler);
