import {
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../lib';
import { start } from 'ern-orchestrator';
import { AppVersionDescriptor, PackagePath } from 'ern-core';
import { Argv } from 'yargs';
import untildify from 'untildify';

export const command = 'start';
export const desc = 'Start a composite MiniApp';

export const builder = (argv: Argv) => {
  return argv
    .option('activityName', {
      alias: 'a',
      describe: 'Android Activity to launch',
      type: 'string',
    })
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', (d) => PackagePath.fromString(d))
    .option('bundleId', {
      alias: 'b',
      describe: 'iOS Bundle Identifier',
      type: 'string',
    })
    .option('compositeDir', {
      describe: 'Directory in which to generate the composite',
      type: 'string',
    })
    .coerce('compositeDir', (p) => untildify(p))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application selector',
      type: 'string',
    })
    .coerce('descriptor', (d) => AppVersionDescriptor.fromString(d))
    .option('extraJsDependencies', {
      alias: 'e',
      describe:
        'Additional JavaScript dependencies to add to the composite JavaScript bundle',
      type: 'array',
    })
    .coerce('extraJsDependencies', (d) => d.map(PackagePath.fromString))
    .option('jsApiImpls', {
      describe: 'A list of one or more JS API Implementation(s)',
      type: 'array',
    })
    .coerce('jsApiImpls', (d) => d.map(PackagePath.fromString))
    .option('flavor', {
      describe: 'Custom binary flavor',
    })
    .option('launchArgs', {
      describe: '[iOS] Arguments to pass to the application when launching it',
      type: 'string',
    })
    .option('launchEnvVars', {
      describe:
        '[iOS] Environment variables to pass to the application when launching it (space separated key=value pairs)',
    })
    .option('launchFlags', {
      describe: '[Android] Flags to pass to the application when launching it',
      type: 'string',
    })
    .option('miniapps', {
      alias: 'm',
      describe: 'A list of one or more MiniApp(s)',
      type: 'array',
    })
    .coerce('miniapps', (d) => d.map(PackagePath.fromString))
    .option('packageName', {
      alias: 'p',
      describe: 'Android application package name',
      type: 'string',
    })
    .option('watchNodeModules', {
      alias: 'w',
      describe:
        'A list of one or more directory name from node_modules that should be watched for changes',
      type: 'array',
    })
    .option('disableBinaryStore', {
      describe:
        'Disable automatic retrieval of the binary from the Binary Store',
      type: 'boolean',
    })
    .option('host', {
      describe: 'Host/IP to use for the local packager',
      type: 'string',
    })
    .option('port', {
      default: '8081',
      describe: 'Port to use for the local package',
      type: 'string',
    })
    .option('resetCache', {
      describe:
        'Indicates whether to reset the React Native cache prior to bundling',
      type: 'boolean',
    })
    .group(
      ['activityName', 'launchFlags', 'packageName'],
      'Android binary launch options:',
    )
    .group(
      ['bundleId', 'launchEnvVars', 'launchArgs'],
      'iOS binary launch options:',
    )
    .group(['disableBinaryStore', 'flavor'], 'Binary store specific options:')
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  activityName,
  baseComposite,
  bundleId,
  compositeDir,
  descriptor,
  extraJsDependencies = [],
  flavor,
  host,
  jsApiImpls,
  launchArgs,
  launchEnvVars,
  launchFlags,
  miniapps,
  packageName,
  port,
  watchNodeModules,
  disableBinaryStore,
  resetCache,
}: {
  activityName?: string;
  baseComposite?: PackagePath;
  bundleId?: string;
  compositeDir?: string;
  descriptor?: AppVersionDescriptor;
  extraJsDependencies?: PackagePath[];
  flavor?: string;
  host?: string;
  jsApiImpls?: PackagePath[];
  launchArgs?: string;
  launchEnvVars?: string;
  launchFlags?: string;
  miniapps?: PackagePath[];
  packageName?: string;
  port?: string;
  watchNodeModules?: string[];
  disableBinaryStore?: boolean;
  resetCache?: boolean;
} = {}) => {
  await logErrorAndExitIfNotSatisfied({
    metroServerIsNotRunning: {
      extraErrorMessage: `You should kill the current server before running this command.`,
      host: host || 'localhost',
      port: port || '8081',
    },
  });

  if (!miniapps && !descriptor) {
    descriptor = await askUserToChooseANapDescriptorFromCauldron();
  }

  await start({
    activityName,
    baseComposite,
    bundleId,
    compositeDir,
    descriptor,
    disableBinaryStore,
    extraJsDependencies,
    flavor,
    host,
    jsApiImpls,
    launchArgs,
    launchEnvVars,
    launchFlags,
    miniapps,
    packageName,
    port,
    resetCache,
    watchNodeModules,
  });
};

export const handler = tryCatchWrap(commandHandler);
