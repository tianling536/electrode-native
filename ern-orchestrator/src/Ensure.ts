import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  dependencyLookup,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import _ from 'lodash'
import semver from 'semver'
import validateNpmPackageName from 'validate-npm-package-name'
import fs from 'fs'
import levenshtein from 'fast-levenshtein'
import * as constants from './constants'
export default class Ensure {
  public static isValidElectrodeNativeModuleName(
    name: string,
    extraErrorMessage: string = ''
  ) {
    if (!coreUtils.isValidElectrodeNativeModuleName(name)) {
      const errorMessage = `${name} is not a valid Electrode Native module name\nCheck GLOSSARY section of doc for "Electrode Native module name" naming rules\n${extraErrorMessage}`
      throw new Error(errorMessage)
    }
  }

  public static isValidNpmPackageName(
    name: string,
    extraErrorMessage: string = ''
  ) {
    const validation = validateNpmPackageName(name)
    if (!validation.validForNewPackages) {
      const errorMessage = `${name} is not a valid NPM package name\n`
        .concat(validation.errors ? validation.errors.join('\n') : '')
        .concat(`\n${extraErrorMessage}`)
      throw new Error(errorMessage)
    }
  }

  public static isValidContainerVersion(
    version: string,
    extraErrorMessage: string = ''
  ) {
    if (/^\d+.\d+.\d+$/.test(version) === false) {
      throw new Error(
        `${version} is not a valid container version.\n${extraErrorMessage}`
      )
    }
  }

  public static async isNewerContainerVersion(
    descriptor: string | NativeApplicationDescriptor,
    containerVersion: string,
    extraErrorMessage: string = ''
  ) {
    const cauldron = await getActiveCauldron()
    const cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(
      coreUtils.coerceToNativeApplicationDescriptor(descriptor)
    )
    if (
      cauldronContainerVersion &&
      !semver.gt(containerVersion, cauldronContainerVersion)
    ) {
      throw new Error(
        `Container version ${containerVersion} is older than ${cauldronContainerVersion}\n${extraErrorMessage}`
      )
    }
  }

  public static isCompleteNapDescriptorString(
    descriptor: string | NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (coreUtils.coerceToNativeApplicationDescriptor(descriptor).isPartial) {
      throw new Error(
        `${descriptor} is not a complete native application descriptor, in the form application:platform:version\n${extraErrorMessage}`
      )
    }
  }

  public static noGitOrFilesystemPath(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const packagePaths = coreUtils.coerceToPackagePathArray(obj)
    for (const packagePath of packagePaths) {
      if (packagePath.isFilePath || packagePath.isGitPath) {
        throw new Error(
          `Found a git or file system path.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static noFileSystemPath(
    obj: string | string[],
    extraErrorMessage: string = ''
  ) {
    const paths = obj instanceof Array ? obj : [obj]
    for (const path of paths) {
      const dependencyPath = PackagePath.fromString(path)
      if (dependencyPath.isFilePath) {
        throw new Error(`Found a file system path.\n${extraErrorMessage}`)
      }
    }
  }

  public static async napDescritorExistsInCauldron(
    d:
      | string
      | NativeApplicationDescriptor
      | Array<string | NativeApplicationDescriptor>,
    extraErrorMessage: string = ''
  ) {
    const cauldron = await getActiveCauldron()
    const descriptors = coreUtils.coerceToNativeApplicationDescriptorArray(d)
    for (const descriptor of descriptors) {
      const result = await cauldron.isDescriptorInCauldron(descriptor)
      if (!result) {
        throw new Error(
          `${descriptor.toString()} descriptor does not exist in Cauldron.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static sameNativeApplicationAndPlatform(
    descriptors: Array<string | NativeApplicationDescriptor>,
    extraErrorMessage: string = ''
  ) {
    const basePathDescriptors = _.map(
      coreUtils.coerceToNativeApplicationDescriptorArray(descriptors),
      d => `${d.name}:${d.platform}`
    )
    if (_.uniq(basePathDescriptors).length > 1) {
      throw new Error(
        `Descriptors do not all match the same native application/platform pair.\n${extraErrorMessage}`
      )
    }
  }

  public static async napDescritorDoesNotExistsInCauldron(
    d: NativeApplicationDescriptor | string,
    extraErrorMessage: string = ''
  ) {
    const cauldron = await getActiveCauldron()
    const descriptor = coreUtils.coerceToNativeApplicationDescriptor(d)
    if (await cauldron.isDescriptorInCauldron(descriptor)) {
      throw new Error(
        `${descriptor} descriptor exist in Cauldron.\n${extraErrorMessage}`
      )
    }
  }

  public static async publishedToNpm(
    obj: string | PackagePath | Array<string | PackagePath>,
    extraErrorMessage: string = ''
  ) {
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      if (!(await coreUtils.isPublishedToNpm(dependency))) {
        throw new Error(
          `${dependency} version is not published to NPM.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async miniAppNotInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const miniApps = coreUtils.coerceToPackagePathArray(obj)
    for (const miniApp of miniApps) {
      if (
        await cauldron.isMiniAppInContainer(napDescriptor, miniApp.basePath)
      ) {
        throw new Error(
          `${
            miniApp.basePath
          } MiniApp exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyNotInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      if (
        await cauldron.isNativeDependencyInContainer(
          napDescriptor,
          dependency.basePath
        )
      ) {
        throw new Error(
          `${
            dependency.basePath
          } dependency exists in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async miniAppIsInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const miniApps = coreUtils.coerceToPackagePathArray(obj)
    for (const miniApp of miniApps) {
      if (
        !(await cauldron.isMiniAppInContainer(napDescriptor, miniApp.basePath))
      ) {
        throw new Error(
          `${
            miniApp.basePath
          } MiniApp does not exist in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyIsInNativeApplicationVersionContainer(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      if (
        !(await cauldron.getContainerNativeDependency(
          napDescriptor,
          dependency.basePath
        ))
      ) {
        throw new Error(
          `${
            dependency.basePath
          } does not exists in ${napDescriptor}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const miniApps = coreUtils.coerceToPackagePathArray(obj)
    await Ensure.miniAppIsInNativeApplicationVersionContainer(
      miniApps,
      napDescriptor
    )
    for (const miniApp of miniApps) {
      const miniAppFromCauldron = await cauldron.getContainerMiniApp(
        napDescriptor,
        miniApp.basePath
      )
      const cauldronMiniApp = PackagePath.fromString(miniAppFromCauldron)
      if (cauldronMiniApp.version === miniApp.version) {
        throw new Error(
          `${
            cauldronMiniApp.basePath
          } is already at version ${miniApp.version ||
            ''} in ${napDescriptor}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
    obj: string | PackagePath[] | Array<string | PackagePath> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    await Ensure.dependencyIsInNativeApplicationVersionContainer(
      obj,
      napDescriptor
    )
    const dependencies = coreUtils.coerceToPackagePathArray(obj)
    for (const dependency of dependencies) {
      const dependencyFromCauldron = await cauldron.getContainerNativeDependency(
        napDescriptor,
        dependency.basePath
      )
      if (
        dependencyFromCauldron &&
        dependencyFromCauldron.version === dependency.version
      ) {
        throw new Error(
          `${
            dependency.basePath
          } is already at version ${dependencyFromCauldron.version ||
            'undefined'} in ${napDescriptor.toString()}.\n${extraErrorMessage}`
        )
      }
    }
  }

  public static async dependencyNotInUseByAMiniApp(
    obj: string | PackagePath | Array<string | PackagePath> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage: string = ''
  ) {
    if (!obj) {
      return
    }
    const cauldron = await getActiveCauldron()
    const dependencies = coreUtils.coerceToPackagePathArray(obj)

    // First let's figure out if any of the MiniApps are using this/these dependency(ies)
    // to make sure that we don't remove any dependency currently used by any MiniApp
    const miniApps = await cauldron.getContainerMiniApps(napDescriptor)

    for (const dependency of dependencies) {
      const miniAppsUsingDependency = await dependencyLookup.getMiniAppsUsingNativeDependency(
        miniApps,
        dependency
      )
      if (miniAppsUsingDependency && miniAppsUsingDependency.length > 0) {
        let errorMessage = ''
        errorMessage += 'The following MiniApp(s) are using this dependency\n'
        for (const miniApp of miniAppsUsingDependency) {
          errorMessage += `=> ${miniApp.name}\n`
        }
        errorMessage +=
          'You cannot remove a native dependency that is being used by at least a MiniApp\n'
        errorMessage +=
          'To properly remove this native dependency, you cant either :\n'
        errorMessage +=
          '- Remove the native dependency from the MiniApp(s) that are using it\n'
        errorMessage += '- Remove the MiniApps that are using this dependency\n'
        errorMessage +=
          '- Provide the force flag to this command (if you really now what you are doing !)'
        throw new Error(errorMessage)
      }
    }
  }

  public static async cauldronIsActive(extraErrorMessage: string = '') {
    if (!(await getActiveCauldron())) {
      throw new Error(`There is no active Cauldron\n${extraErrorMessage}`)
    }
  }

  public static async pathExist(
    p: fs.PathLike,
    extraErrorMessage: string = ''
  ) {
    return new Promise((resolve, reject) => {
      fs.exists(
        p,
        exists =>
          exists
            ? resolve()
            : reject(
                new Error(`${p} path does not exist.\n${extraErrorMessage}`)
              )
      )
    })
  }

  public static async isFilePath(
    p: fs.PathLike,
    extraErrorMessage: string = ''
  ) {
    return new Promise((resolve, reject) => {
      fs.stat(p, (err, stats) => {
        if (err) {
          reject(new Error(`${p} path does not exist.\n${extraErrorMessage}`))
        } else {
          if (stats.isFile()) {
            resolve()
          } else {
            reject(new Error(`${p} is not a file.\n${extraErrorMessage}`))
          }
        }
      })
    })
  }

  public static async isDirectoryPath(
    p: fs.PathLike,
    extraErrorMessage: string = ''
  ) {
    return new Promise((resolve, reject) => {
      fs.stat(p, (err, stats) => {
        if (err) {
          reject(new Error(`${p} path does not exist.\n${extraErrorMessage}`))
        } else {
          if (stats.isDirectory()) {
            resolve()
          } else {
            reject(new Error(`${p} is not a directory.\n${extraErrorMessage}`))
          }
        }
      })
    })
  }

  public static checkIfCodePushOptionsAreValid(
    descriptors?: Array<string | NativeApplicationDescriptor>,
    targetBinaryVersion?: string,
    semVerDescriptor?: string,
    extraErrorMessage: string = ''
  ) {
    if (targetBinaryVersion && semVerDescriptor) {
      throw new Error(
        'Specify either targetBinaryVersion or semVerDescriptor not both'
      )
    }
    if (targetBinaryVersion && descriptors && descriptors.length > 1) {
      throw new Error(
        'targetBinaryVersion must specify only 1 target native application version for the push'
      )
    }
  }

  public static isValidPlatformConfig(
    key: string,
    extraErrorMessage: string = ''
  ) {
    const availablePlatformKeys = () =>
      constants.availableUserConfigKeys.map(e => e.name)
    if (!availablePlatformKeys().includes(key)) {
      const closestKeyName = k =>
        availablePlatformKeys().reduce(
          (acc, cur) =>
            levenshtein.get(acc, k) > levenshtein.get(cur, k) ? cur : acc
        )
      throw new Error(
        `Configuration key ${key} does not exists. Did you mean ${closestKeyName(
          key
        )}?`
      )
    }
  }
}