## `ern platform config set`

#### Description

- Set the local platform configuration values stored in the `~/.ern/.ernrc` file

#### Syntax

`ern platform config set <key> <value>`

**Arguments**

`<key>`

- The key of the configuration element to set

`<value>`

- If specified, will set the config value associated to this key.

**Configurable properties**

- `codePushAccessKey` [string]\
  Code push access key associated with your account

- `codePushCustomHeaders` [string]\
  CodePush custom extra http headers.

- `codePushCustomServerUrl` [string]\
  CodePush custom server url, in case you are not using the Microsoft CodePush server.

- `codePushProxy` [string]\
  CodePush proxy server url.

- `ignore-required-ern-version` [boolean]\
  Indicates whether any Cauldron ern version requirement should be ignored.\
  This is mostly used for Electrode Native development and should not be set to true otherwise.\
  **default** : false

- `logLevel` [trace|debug|info|error|fatal]\
  Set the log level to use for all commands.\
  **default** : info

- `max-package-cache-size` [number]\
  The maximum disk space to use for the package cache, in Bytes.\
  Only apply if the package cache is enabled (`package-cache-enabled` configuration key set to `true`).\
  **default** : 2GB

- `package-cache-enabled` [boolean]\
  Indicates whether the package cache should be enabled.\
  Enabling the package cache will lead to faster Containers generation, given that all packages versions used for a Container generation, will be retrieved from the cache if available rather than being downloaded upon every generation.\
  **default** : true

- `podVersion` [string]\
  Version of CocoaPods (pod command) to use for iOS container generation.\
  **The version must be available (installed) locally**\
  **default** : default CocoaPods version for environment

- `retain-tmp-dir` [boolean]\
  If set to `true`, the temporary directories created during some commands execution, won't be destroyed after the command execution.\
  **default** : false

- `showBanner` [boolean]\
  Show the Electrode Native ASCII banner for all commands.\
  **default** : true

- `tmp-dir` [string]\
  Temporary directory to use during commands execution.\
  **default** : system default

- `bundleStoreProxy` [string]\
  HTTP/HTTPS proxy to use to connect to the bundle store server.\
  Should be the full url to the proxy, including the port. For example `http://10.0.0.0:9089`.\
  **default** : no proxy

- `sourceMapStoreProxy` [string]\
  HTTP/HTTPS proxy to use to connect to the source map store server.\
  Should be the full url to the proxy, including the port. For example `http://10.0.0.0:9089`.\
  **default** : no proxy

- `binaryStoreProxy` [string]
  HTTP/HTTPS proxy to use to connect to the binary store server.\
  Should be the full url to the proxy, including the port. For example `http://10.0.0.0:9089`.\
  **default** : no proxy

- `manifest` [object]\
  Master and/or override manifest paths to be used locally.\
  **If this object is defined in the local configuration, it will take precedence over any cauldron manifest configuration**

For example :

```json
{
  "manifest": {
    "master": {
      "url": "/local/path/to/master/manifest"
    },
    "override": {
      "type": "partial",
      "url": "/local/path/to/override/manifest"
    }
  }
}
```

#### Remarks

- In case a value already exists in the configuration for a given key, this command will not fail and will overwrite the existing value.

### Placeholders

Electrode Native supports the following placeholders and will replace them accordingly when loading the configuration :

- `${env.ENV_VAR_KEY}`\
  Will be replaced with the value of `ENV_VAR_KEY` environment variable.

- `${ERNRC}`\
  Will be replaced with the path to the directory containing the resolved `.ernrc` configuration.

- `${PWD}`\
  Will be replaced with current process working directory.

[electrode native bundle store server]: https://github.com/electrode-io/ern-bundle-store
