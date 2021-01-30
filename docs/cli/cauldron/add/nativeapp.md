## `ern cauldron add nativeapp`

#### Description

- Add a new native application version to the currently activated Cauldron

#### Syntax

`ern cauldron add nativeapp <descriptor>`

**Arguments**

`<descriptor>`

- A complete native application descriptor representing the native application version to be added to the Cauldron.

**Example**

`ern cauldron add nativeapp MyNativeApp:ios:17.14.0`

**Options**

`--platformVersion/-v`

- Use specified platform version

`--copyFromVersion/-c <version>`

- Copy the data of a native application version stored in the Cauldron.
- Possible values for this option are :
  - A specific version, for example `1.2.3`
  - `latest` if you want to copy the data from the latest version of the native application
  - `none` if you don't want any copy from action
- The `--copyFromVersion/-c <version>` option also copies the list of native dependencies and MiniApps as well as the container version to the new native application version.
- If you use the `--copyFromVersion/-c <version>` option, you do not need to add all MiniApps again after creating a new native application version in the Cauldron.
- This option is commonly used.

`--description`

- Description of the native application version

`--config`

- Configuration to set for this new native application version
- If not provided, the configuration of the version copied from will be used (if any).
- There is three different ways to provide the configuration :
  - **As a json string**  
    For example `--config '{"configKey": "configValue"}'`
  - **As a file path**  
    For example `--config /etc/config.json`  
    In that case, the configuration will be read from the file
  - **As a Cauldron file path**  
    For example `--extra cauldron://config/myapp-android.json`  
    In that case, the configuration will be read from the file stored in Cauldron.  
    For this way to work, the file must exist in Cauldron (you can add a file to the cauldron by using the [ern cauldron add file] command).

#### Remarks

- The `ern cauldron add nativeapp <descriptor>` command is usually used when the development of a new version of the native application is started.
- The new native application version is identified by the _complete native application description_ in the Cauldron.

#### Related commands

[ern cauldron update nativeapp] | Add a new native application version to the currently activated Cauldron

---

[ern cauldron update nativeapp]: ../update/nativeapp.md
