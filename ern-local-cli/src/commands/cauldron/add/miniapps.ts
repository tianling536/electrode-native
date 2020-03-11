import { PackagePath, AppVersionDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { syncCauldronContainer } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
} from '../../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'miniapps <miniapps..>'
export const desc =
  'Add one or more MiniApp(s) to a given native application version in the Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, version will be patched bumped by default.',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'A complete native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .option('resetCache', {
      default: false,
      describe:
        'Indicates whether to reset the React Native cache prior to bundling',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  descriptor,
  miniapps,
  resetCache,
}: {
  containerVersion?: string
  descriptor?: AppVersionDescriptor
  miniapps: PackagePath[]
  resetCache?: boolean
}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))

  await logErrorAndExitIfNotSatisfied({
    isNewerContainerVersion: containerVersion
      ? {
          containerVersion,
          descriptor,
          extraErrorMessage:
            'To avoid conflicts with previous versions, you can only use container version newer than the current one',
        }
      : undefined,
    isSupportedMiniAppOrJsApiImplVersion: {
      obj: miniapps,
    },
    miniAppNotInNativeApplicationVersionContainer: {
      descriptor,
      extraErrorMessage:
        'To update MiniApp(s) use -ern cauldron update miniapps- command',
      miniApp: miniapps,
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  const cauldron = await getActiveCauldron()

  const cauldronCommitMessage = [
    `${
      miniapps.length === 1
        ? `Add ${miniapps[0]} MiniApp to ${descriptor}`
        : `Add multiple MiniApps to ${descriptor}`
    }`,
  ]

  await syncCauldronContainer(
    async () => {
      for (const miniApp of miniapps) {
        cauldronCommitMessage.push(`- Add ${miniApp.basePath} MiniApp`)
      }
      await cauldron.syncContainerMiniApps(descriptor!, miniapps)
    },
    descriptor,
    cauldronCommitMessage,
    { containerVersion, resetCache }
  )
  log.debug(`MiniApp(s) successfully added to ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)
