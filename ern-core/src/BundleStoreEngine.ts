import { BundleStoreSdk } from './BundleStoreSdk'
import config from './config'
import createTmpDir from './createTmpDir'
import log from './log'
import fs from 'fs'
import path from 'path'
import got from 'got'
import ipc from 'node-ipc'
import yazl from 'yazl'
import { NativePlatform } from './NativePlatform'
import { createProxyAgentFromErnConfig } from './createProxyAgent'

export class BundleStoreEngine {
  private readonly sdk: BundleStoreSdk
  private assets: any[]

  constructor(public readonly host: string) {
    this.sdk = new BundleStoreSdk(host)
    this.assets = []

    ipc.config.silent = true
    ipc.config.id = 'ern-bundle-store'
    ipc.serve(() => {
      ipc.server.on('assets', (data: any, socket: any) => {
        log.debug(`received asset : ${JSON.stringify(data)}`)
        this.assets.push(JSON.parse(data))
      })
    })
    ipc.server.start()
  }

  public async upload({
    bundlePath,
    platform,
    sourceMapPath,
  }: {
    bundlePath: string
    platform: string
    sourceMapPath: string
  }): Promise<string> {
    const res = await this.sdk.uploadBundle({
      accessKey: config.get('bundlestore-accesskey'),
      bundlePath,
      platform,
      sourceMapPath,
      store: config.get('bundlestore-id'),
    })
    await this.uploadAssets()
    ipc.server.stop()
    return res
  }

  public async uploadAssets() {
    const newAssets = await this.sdk.assetsDelta(this.assets.map(a => a.hash))

    if (newAssets.length > 0) {
      log.debug(`Uploading ${newAssets.length} new asset(s)`)

      const zipfile = new yazl.ZipFile()
      const tmpZipPath = path.join(createTmpDir(), 'assets.zip')
      const s = fs.createWriteStream(tmpZipPath)
      zipfile.outputStream.pipe(s)
      for (const asset of this.assets) {
        for (const file of asset.files) {
          const hash = asset.hash
          zipfile.addFile(file, path.join(hash, path.basename(file)))
        }
      }
      zipfile.end()

      const assetsProm = new Promise((resolve, reject) => {
        s.on('close', () => {
          resolve()
        })
      })

      await assetsProm
      await this.sdk.uploadAssets(tmpZipPath)
    } else {
      log.debug('No new assets !')
    }
  }

  public async uploadFromPackager({
    dev,
    platform,
  }: {
    dev?: boolean
    platform?: NativePlatform
  } = {}): Promise<string> {
    const tmpDir = createTmpDir()
    const bundlePath = path.join(tmpDir, 'index.bundle')
    const sourceMapPath = path.join(tmpDir, 'index.map')
    const streamBundle = fs.createWriteStream(bundlePath)
    const streamSourceMap = fs.createWriteStream(sourceMapPath)

    const reqBundle = got.stream(
      `http://localhost:8081/index.bundle?platform=${platform}&dev=${!!dev}&minify=true`,
      {
        agent: createProxyAgentFromErnConfig('bundleStoreProxy'),
      }
    )
    const reqSourceMap = got.stream(
      `http://localhost:8081/index.map?platform=${platform}&dev=${!!dev}&minify=true`,
      {
        agent: createProxyAgentFromErnConfig('bundleStoreProxy'),
      }
    )
    const sBundle = reqBundle.pipe(streamBundle)
    const sSourceMap = reqSourceMap.pipe(streamSourceMap)

    const pBundle = new Promise((resolve, reject) =>
      sBundle.on('finish', () => resolve())
    )
    const pSourceMap = new Promise((resolve, reject) => {
      sSourceMap.on('finish', () => resolve())
    })

    await Promise.all([pBundle, pSourceMap])

    const res = await this.sdk.uploadBundle({
      accessKey: config.get('bundlestore-accesskey'),
      bundlePath,
      platform: 'android',
      sourceMapPath,
      store: config.get('bundlestore-id'),
    })
    streamBundle.close()
    streamSourceMap.close()

    await this.uploadAssets()
    ipc.server.stop()
    return res
  }
}
