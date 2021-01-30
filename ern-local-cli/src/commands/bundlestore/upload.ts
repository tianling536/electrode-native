import {
  AppVersionDescriptor,
  BundleStoreEngine,
  createTmpDir,
  kax,
  log,
  NativePlatform,
  PackagePath,
} from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import { generateComposite } from 'ern-composite-gen';
import { bundleMiniAppsFromComposite } from 'ern-container-gen';
import {
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib';
import { Argv } from 'yargs';
import path from 'path';

export const command = 'upload';
export const desc = 'Upload a bundle to a store';

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', (d) => PackagePath.fromString(d))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', (d) => AppVersionDescriptor.fromString(d))
    .option('extraJsDependencies', {
      alias: 'e',
      describe: 'Additional JS dependency(ies)',
      type: 'array',
    })
    .coerce('extraJsDependencies', (d) => d.map(PackagePath.fromString))
    .option('fromGitBranches', {
      describe: 'Favor MiniApp(s) branches',
      type: 'boolean',
    })
    .option('fromPackager', {
      describe: 'Upload bundle served by current local packager',
      type: 'boolean',
    })
    .option('jsApiImpls', {
      describe: 'One or more JS API implementation(s)',
      type: 'array',
    })
    .coerce('jsApiImpls', (d) => d.map(PackagePath.fromString))
    .option('miniapps', {
      alias: 'm',
      describe: 'One or more MiniApp(s)',
      type: 'array',
    })
    .option('platform', {
      choices: ['android', 'ios', undefined],
      describe:
        'If set will only upload the bundle for this platform (otherwise will upload for both platforms)',
      type: 'string',
    })
    .option('prod', {
      describe:
        'Set to upload a production bundle rather than a development one',
      type: 'boolean',
    })
    .option('resetCache', {
      describe:
        'Indicates whether to reset the React Native cache prior to bundling',
      type: 'boolean',
    })
    .coerce('miniapps', (d) => d.map(PackagePath.fromString))
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  baseComposite,
  descriptor,
  extraJsDependencies,
  fromGitBranches,
  fromPackager,
  jsApiImpls,
  miniapps,
  platform,
  prod,
  resetCache,
}: {
  baseComposite?: PackagePath;
  descriptor?: AppVersionDescriptor;
  extraJsDependencies?: PackagePath[];
  fromGitBranches?: boolean;
  fromPackager?: boolean;
  jsApiImpls?: PackagePath[];
  miniapps?: PackagePath[];
  platform?: NativePlatform;
  prod?: boolean;
  resetCache?: boolean;
} = {}) => {
  await logErrorAndExitIfNotSatisfied({
    bundleStoreAccessKeyIsSet: {
      extraErrorMessage: `You can use:
'ern bundlestore use <accessKey>' to use an existing store OR 
'ern bundlestore create <storeName>' to create a new store`,
    },
    bundleStoreUrlSetInCauldron: {
      extraErrorMessage: `You should add bundleStore config in your Cauldron`,
    },
  });

  const platforms: NativePlatform[] = platform
    ? [platform]
    : ['android', 'ios'];

  const cauldron = await getActiveCauldron();
  const bundleStoreUrl = (await cauldron.getBundleStoreConfig()).url;
  const engine = new BundleStoreEngine(bundleStoreUrl);
  if (fromPackager) {
    for (const curPlatform of platforms) {
      const bundleId = await kax
        .task(`Uploading ${curPlatform} bundle`)
        .run(engine.uploadFromPackager({ platform: curPlatform, dev: !prod }));
      log.info(`Successfully uploaded ${curPlatform} bundle [id: ${bundleId}]`);
    }
  } else {
    // Full native application descriptor was not provided.
    // Ask the user to select a completeNapDescriptor from a list
    // containing all the native applications versions in the cauldron
    // Not needed if miniapps are directly provided
    if (!descriptor && !miniapps) {
      descriptor = await askUserToChooseANapDescriptorFromCauldron();
    }

    let pathToYarnLock;
    let resolutions;
    let metroExtraNodeModules;
    if (descriptor) {
      await logErrorAndExitIfNotSatisfied({
        napDescriptorExistInCauldron: {
          descriptor,
          extraErrorMessage:
            'You cannot create a composite for a non-existing native application version.',
        },
      });
      miniapps = await cauldron.getContainerMiniApps(descriptor, {
        favorGitBranches: !!fromGitBranches,
      });
      jsApiImpls = await cauldron.getContainerJsApiImpls(descriptor);
      const containerGenConfig = await cauldron.getContainerGeneratorConfig(
        descriptor,
      );
      if (!containerGenConfig || !containerGenConfig.bypassYarnLock) {
        pathToYarnLock = await cauldron.getPathToYarnLock(
          descriptor,
          'container',
        );
      } else {
        log.debug(
          'Bypassing yarn.lock usage as bypassYarnLock flag is set in config',
        );
      }
      const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
        descriptor,
      );
      baseComposite =
        baseComposite ||
        (compositeGenConfig?.baseComposite &&
          PackagePath.fromString(compositeGenConfig.baseComposite));
      resolutions = compositeGenConfig && compositeGenConfig.resolutions;
      metroExtraNodeModules =
        compositeGenConfig && compositeGenConfig.metroExtraNodeModules;
    }

    const compositeDir = createTmpDir();
    await kax.task('Generating Composite').run(
      generateComposite({
        baseComposite,
        extraJsDependencies,
        jsApiImplDependencies: jsApiImpls,
        metroExtraNodeModules,
        miniApps: miniapps!,
        outDir: compositeDir,
        pathToYarnLock,
        resolutions,
      }),
    );

    for (const curPlatform of platforms) {
      const outDir = createTmpDir();
      const bundlePath = path.join(outDir, 'index.bundle');
      const sourceMapPath = path.join(outDir, 'index.map');
      await kax.task(`Bundling MiniApps for ${curPlatform}`).run(
        bundleMiniAppsFromComposite({
          bundleOutput: bundlePath,
          compositeDir,
          dev: !prod,
          outDir,
          platform: curPlatform,
          resetCache,
          sourceMapOutput: path.join(outDir, 'index.map'),
        }),
      );
      const bundleId = await kax
        .task(`Uploading ${curPlatform} bundle`)
        .run(
          engine.upload({ bundlePath, platform: curPlatform, sourceMapPath }),
        );
      log.info(`Successfully uploaded ${curPlatform} bundle [id: ${bundleId}]`);
    }
  }
};

export const handler = tryCatchWrap(commandHandler);
