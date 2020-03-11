import {
  PackagePath,
  manifest,
  MiniApp,
  log,
  kax,
  AppVersionDescriptor,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import _ from 'lodash'
import chalk from 'chalk'
import Table from 'cli-table'
import semver from 'semver'

//
// Check compatibility of a given miniapp against one or multiple native apps
export async function checkCompatibilityWithNativeApp(
  miniApp: MiniApp,
  appName: string,
  platformName?: string,
  versionName?: string
): Promise<any> {
  const compatReport: any[] = await kax.task('Checking compatibility').run(
    getNativeAppCompatibilityReport(miniApp, {
      appName,
      platformName,
      versionName,
    })
  )

  for (const r of compatReport) {
    log.info(
      chalk.magenta(`${r.appName}:${r.appPlatform}:${r.appVersion}`) +
        ' : ' +
        (r.isCompatible
          ? chalk.green('COMPATIBLE')
          : chalk.red('NOT COMPATIBLE'))
    )

    logCompatibilityReportTable(r.compatibility)

    if (appName && platformName && versionName) {
      return r
    }
  }
}

//
// Check compatibility of a given miniapp against a given platform version
export async function checkCompatibilityWithPlatform(
  miniApp: MiniApp,
  platformVersion: string
) {
  const miniappDependencies = miniApp.getPackageJsonDependencies()
  const platformDependencies = await manifest.getJsAndNativeDependencies({
    platformVersion,
  })

  const report = getCompatibility(miniappDependencies, platformDependencies)
  const isCompatible = report.incompatible.length === 0

  log.info(
    isCompatible ? chalk.green('COMPATIBLE') : chalk.red('NOT COMPATIBLE')
  )

  logCompatibilityReportTable(report)
}

//
// Log compatiblity report to terminal in a fancy table
export async function logCompatibilityReportTable(report: any) {
  const table = new Table({
    colWidths: [40, 16, 15],
    head: [
      chalk.cyan('Name'),
      chalk.cyan('Needed Version'),
      chalk.cyan('Local Version'),
    ],
  })

  for (const compatibleEntry of report.compatible) {
    table.push([
      compatibleEntry.dependencyName,
      chalk.green(
        compatibleEntry.remoteVersion ? compatibleEntry.remoteVersion : ''
      ),
      chalk.green(
        compatibleEntry.localVersion ? compatibleEntry.localVersion : ''
      ),
    ])
  }

  for (const compatibleNonStrictEntry of report.compatibleNonStrict) {
    table.push([
      compatibleNonStrictEntry.dependencyName,
      chalk.yellow(
        compatibleNonStrictEntry.remoteVersion
          ? compatibleNonStrictEntry.remoteVersion
          : ''
      ),
      chalk.yellow(
        compatibleNonStrictEntry.localVersion
          ? compatibleNonStrictEntry.localVersion
          : ''
      ),
    ])
  }

  for (const incompatibleEntry of report.incompatible) {
    table.push([
      incompatibleEntry.dependencyName,
      incompatibleEntry.remoteVersion,
      chalk.red(incompatibleEntry.localVersion),
    ])
  }

  log.info(table.toString())
}

//
// Retrieve compatibility report(s) of a given miniapp against one or multiple native apps
export async function getNativeAppCompatibilityReport(
  miniApp: MiniApp,
  {
    appName,
    platformName,
    versionName,
  }: {
    appName?: string
    platformName?: string
    versionName?: string
  }
) {
  const result: any[] = []
  const cauldron = await getActiveCauldron()
  const nativeApps = await cauldron.getAllNativeApps()

  // Todo : pass miniapp to these functions instead (or just move compat methods in MiniApp class maybe)
  const nativeDependencies = await miniApp.getNativeDependencies()
  const miniappDependencies = [
    ...nativeDependencies.apis,
    ...nativeDependencies.nativeApisImpl,
    ...nativeDependencies.thirdPartyInManifest,
  ]

  // I so love building pyramids !!! :P
  for (const nativeApp of nativeApps) {
    if (!appName || nativeApp.name === appName) {
      for (const nativeAppPlatform of nativeApp.platforms) {
        if (!platformName || nativeAppPlatform.name === platformName) {
          for (const nativeAppVersion of nativeAppPlatform.versions) {
            if (!versionName || nativeAppVersion.name === versionName) {
              const napDescriptor = new AppVersionDescriptor(
                nativeApp.name,
                nativeAppPlatform.name,
                nativeAppVersion.name
              )
              const nativeAppDependencies = await cauldron.getNativeDependencies(
                napDescriptor
              )
              const compatibility = getCompatibility(
                miniappDependencies,
                nativeAppDependencies,
                {
                  uncompatibleIfARemoteDepIsMissing:
                    nativeAppVersion.isReleased,
                }
              )
              result.push({
                appBinary: nativeAppVersion.binary,
                appName: nativeApp.name,
                appPlatform: nativeAppPlatform.name,
                appVersion: nativeAppVersion.name,
                compatibility,
                isCompatible: compatibility.incompatible.length === 0,
                isReleased: nativeAppVersion.isReleased,
              })
            }
          }
        }
      }
    }
  }

  return result
}

//
// Get a compatibility object containing the compatibility result
// from comparing an array of dependencies (localDeps) against anoter
// array of dependencies (remoteDeps)
//
// Input : localDeps/remoteDeps sample array :
//
// [{
//   name: "react-native-electrode-bridge",
//   scope: "walmart",
//   version: "1.0.0"
// }]
//
// Output object example :
//
// {
//   compatible: [
//     {
//       dependencyName: "react-native-electrode-bridge",
//       scope: "walmart",
//       localVersion: "1.0.0",
//       remoteVersion: "1.0.0"
//     }
//   ],
//   compatibleNonStrict: [
//     {
//       dependencyName: "react-native-cookie-api",
//       scope: "walmart",
//       localVersion: "1.0.0",
//       remoteVersion: "1.3.0"
//     }
//   ],
//   incompatible: [
//     {
//       dependencyName: "react-native",
//       localVersion: "0.38.2",
//       remoteVersion: "0.40.0"
//     }
//   ]
// }
//
// Optional inputs :
// - uncompatibleIfARemoteDepIsMissing : true if a missing remote
// dependency should be deemed uncompatible (for example for released
// native application versions, if a native dependency is missing from
// the binary, it's not compatible. On the other hand, for non released
// versions it's OK as it's always possible to regenerate a container
// that include this new native dependency)
export function getCompatibility(
  localDeps: PackagePath[],
  remoteDeps: PackagePath[],
  {
    uncompatibleIfARemoteDepIsMissing,
  }: {
    uncompatibleIfARemoteDepIsMissing?: boolean
  } = {}
) {
  const result: any = {
    compatible: [],
    compatibleNonStrict: [],
    incompatible: [],
  }

  for (const remoteDep of remoteDeps) {
    const localDep = _.find(localDeps, d =>
      remoteDep.same(d, { ignoreVersion: true })
    )
    const localDepVersion = localDep ? localDep.version : undefined

    const entry = {
      dependencyName: remoteDep.name,
      localVersion: localDepVersion,
      remoteVersion: remoteDep.version,
    }

    // If a remote dependency exists locally the following applies in term
    // of compatibility
    // If same exact version : COMPATIBLE
    // If different version :
    //    - If API or BRIDGE :
    //      + If local version < remote version but MAJOR is same :
    //          => COMPATIBLE (backward compatibility of APIs / Bridge)
    //      + If local version < remove version but MAJOR is different :
    //          => INCOMPATIBLE (breaking change)
    //      + If local version > remote version
    //          => INCOMPATIBLE (could be using feature not present in older)
    //    - If third party plugin :
    //      => INCOMPATIBLE
    if (localDep && localDepVersion && localDepVersion !== remoteDep.version) {
      // Todo : do not infer api or api-impl by looking solely at the suffix as its not mandatory anymore, so
      // we might get false negatives
      if (
        localDep.name!.endsWith('-api') ||
        localDep.name!.endsWith('-api-impl') ||
        localDep.name! === 'react-native-electrode-bridge'
      ) {
        if (
          semver.major(localDepVersion) ===
          semver.major(<string>remoteDep.version)
        ) {
          if (semver.lt(localDepVersion, <string>remoteDep.version)) {
            result.compatibleNonStrict.push(entry)
          } else {
            result.incompatible.push(entry)
          }
        } else {
          result.incompatible.push(entry)
        }
      } else {
        result.incompatible.push(entry)
      }
    } else if (localDepVersion && localDepVersion === remoteDep.version) {
      result.compatible.push(entry)
    }
  }

  if (uncompatibleIfARemoteDepIsMissing) {
    for (const localDep of localDeps) {
      const remoteDep = _.find(remoteDeps, d => d.name! === localDep.name!)
      const remoteDepVersion = remoteDep ? remoteDep.version : undefined

      const entry = {
        dependencyName: localDep.name!,
        localVersion: localDep.version,
        remoteVersion: remoteDepVersion || 'MISSING',
      }

      if (!remoteDepVersion) {
        result.incompatible.push(entry)
      }
    }
  }

  return result
}

export async function areCompatible(
  miniApps: PackagePath[],
  targetDescriptor: AppVersionDescriptor
): Promise<boolean> {
  for (const miniApp of miniApps) {
    const miniAppInstance = await kax
      .task(
        `Checking native dependencies version alignment of ${miniApp} with ${targetDescriptor}`
      )
      .run(MiniApp.fromPackagePath(new PackagePath(miniApp.toString())))
    const report = await checkCompatibilityWithNativeApp(
      miniAppInstance,
      targetDescriptor.name,
      targetDescriptor.platform || undefined,
      targetDescriptor.version || undefined
    )
    if (!report.isCompatible) {
      log.warn('At least one native dependency version is not aligned !')
      return false
    } else {
      log.info(
        `${miniApp} native dependencies versions are aligned with ${targetDescriptor}`
      )
    }
  }
  return true
}
