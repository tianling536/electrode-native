import createTmpDir from './createTmpDir';
import shell from './shell';
import path from 'path';
import { PackagePath } from './PackagePath';
import { execp } from './childProcess';
import log from './log';
import { spawn } from 'cross-spawn';
import { readPackageJson } from './packageJsonFileUtils';

export class YarnCli {
  public readonly binaryPath: string;

  constructor(binaryPath: string = 'yarn') {
    this.binaryPath = binaryPath;
  }

  public async add(
    dependencyPath: PackagePath,
    {
      dev,
      peer,
    }: {
      dev?: boolean;
      peer?: boolean;
    } = {},
  ) {
    // Special handling with yarn add when the dependency is a local file path
    // In that case, for some reason it copies the node_modules directory of this path, which
    // is not a wanted behavior, especially for react-native bundling as it will create
    // haste module naming collisions
    // As a temporaray work-around, we copy the whole package directory to a temporary one
    // and remove node_modules from there and use this new path instead when yarn adding
    // Issue has been opened here https://github.com/yarnpkg/yarn/issues/1334
    // (still open as of this comment writing)
    // [Note: We tried another lighter workaround being to just remove the node_modules
    // directory contained within this package after yarn add is executed. Howver subsequent
    // yarn add of a different dependency just reintroduce the error on previous package
    // this is really weird]
    if (dependencyPath.isFilePath) {
      const tmpDirPath = createTmpDir();
      shell.cp('-R', path.join(dependencyPath.basePath, '{.*,*}'), tmpDirPath);
      shell.rm('-rf', path.join(tmpDirPath, 'node_modules'));
      dependencyPath = PackagePath.fromString(`file:${tmpDirPath}`);
    }

    const cmd = `add ${dependencyPath.toString()} --ignore-engines --non-interactive --exact ${
      dev ? '--dev' : ''
    } ${peer ? '--peer' : ''}`;
    return this.runYarnCommand(cmd);
  }

  public async install() {
    const cmd = `install --ignore-engines`;
    return this.runYarnCommand(cmd);
  }

  public async upgrade(dependencyPath: PackagePath) {
    const cmd = `upgrade ${dependencyPath.toString()} --ignore-engines --exact`;
    return this.runYarnCommand(cmd);
  }

  public async init() {
    const cmd = `init --yes`;
    return this.runYarnCommand(cmd);
  }

  public async info(
    dependencyPath: PackagePath,
    {
      field,
    }: {
      field?: string;
    } = {},
  ) {
    log.trace(`[YarnCli] info(${dependencyPath}, {field: ${field}})`);

    if (dependencyPath.isFilePath) {
      const pJson = await readPackageJson(dependencyPath.basePath);
      return field ? pJson[field] : pJson;
    } else {
      const args = [
        'info',
        dependencyPath.toString(),
        ...(field ? [field] : []),
        '--json',
      ];

      return new Promise((resolve, reject) => {
        const cp = spawn(this.binaryPath, args);
        cp.stdout.on('data', (data) => {
          log.trace(data);
          const jsonLine = JSON.parse(data.toString());
          if (jsonLine.type === 'inspect') {
            resolve(jsonLine.data);
          }
        });
        cp.stderr.on('data', (data) => {
          log.trace(data);
          const jsonLine = JSON.parse(data.toString());
          // 'warning' and 'error' packet types are sent to stderr
          // we want to fail only on 'error'
          if (jsonLine.type === 'error') {
            reject(jsonLine.data);
          }
        });
      });
    }
  }

  public async runYarnCommand(command: string): Promise<string | Buffer> {
    const cmd = `${this.binaryPath} ${command}`;
    log.debug(`[runYarnCommand] Running ${cmd}`);
    return execp(cmd);
  }
}
