import untildify from 'untildify';
import { readPackageJsonSync } from './packageJsonFileUtils';

const FILE_PATH_WITH_PREFIX_RE = /^file:(.+)/;
const FILE_PATH_WITHOUT_PREFIX_RE = /^(\/.+)/;
const FILE_PATH_TIDLE_RE = /^(~\/.+)/;
const FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE = /^([a-zA-Z]:\\[\\\S|*\S]?.*)$/;
const FILE_PATH_RE = new RegExp(
  `${FILE_PATH_WITH_PREFIX_RE.source}|${FILE_PATH_WITHOUT_PREFIX_RE.source}|${FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE.source}|${FILE_PATH_TIDLE_RE.source}`,
);
const GIT_SSH_PATH_RE = new RegExp(/^git\+ssh:\/\/.+$/);
const GIT_SSH_PATH_VERSION_RE = new RegExp(/^(git\+ssh:\/\/.+)#(.+)$/);
const GIT_HTTPS_PATH_RE = new RegExp(/^https:\/\/.+$/);
const GIT_HTTPS_PATH_VERSION_RE = new RegExp(/^(https:\/\/.+)#(.+)$/);
const GITHUB_SSH_PATH_RE = new RegExp(/^git@[^:]+:[^\/]+\/.+\.git$/);
const GITHUB_SSH_PATH_VERSION_RE = new RegExp(/^git@[^:]+:[^\/]+\/.+\.git#.+$/);
const GIT_PATH_RE = new RegExp(
  `${GIT_SSH_PATH_RE.source}|${GIT_SSH_PATH_VERSION_RE.source}|${GIT_HTTPS_PATH_RE.source}|${GIT_HTTPS_PATH_VERSION_RE.source}|${GITHUB_SSH_PATH_VERSION_RE.source}|${GITHUB_SSH_PATH_RE.source}`,
);
const REGISTRY_PATH_VERSION_RE = new RegExp(/^(.+)@(.+)$/);

export class PackagePath {
  /**
   * Creates a PackagePath from a string
   * @param path Full path to the package (registry|git|file)
   */
  public static fromString(path: string) {
    return new PackagePath(path);
  }

  /**
   * Full path to the package
   */
  public readonly fullPath: string;

  /**
   * Package path without version
   * - File path        : path without scheme prefix
   * - Git path         : path without branch/tag/commit
   * - Registry path    : package name (including scope if any)
   */
  public readonly basePath: string;

  /**
   * Version of the package
   * - File path        : version from package.json
   * - Git path         : branch/tag/commit || undefined
   * - Descriptor path  : package version || undefined
   */
  public readonly version?: string;

  /**
   * Name of the package
   * - File path        : name from package.json
   * - Git path         : undefined
   * - Registry path    : package name
   */
  public readonly name?: string;

  /**
   * Creates a PackagePath
   * @param path Full path to the package (registry|git|file)
   */
  constructor(path: string) {
    // Transform GitHub SSH urls
    if (
      GITHUB_SSH_PATH_VERSION_RE.test(path) ||
      GITHUB_SSH_PATH_RE.test(path)
    ) {
      path = `git+ssh://${path.replace(':', '/')}`;
    }

    if (GIT_SSH_PATH_VERSION_RE.test(path)) {
      this.basePath = GIT_SSH_PATH_VERSION_RE.exec(path)![1];
      this.version = GIT_SSH_PATH_VERSION_RE.exec(path)![2];
    } else if (GIT_HTTPS_PATH_VERSION_RE.test(path)) {
      this.basePath = GIT_HTTPS_PATH_VERSION_RE.exec(path)![1];
      this.version = GIT_HTTPS_PATH_VERSION_RE.exec(path)![2];
    } else if (GIT_SSH_PATH_RE.test(path) || GIT_HTTPS_PATH_RE.test(path)) {
      this.basePath = path;
    } else if (FILE_PATH_WITH_PREFIX_RE.test(path)) {
      this.basePath = FILE_PATH_WITH_PREFIX_RE.exec(path)![1];
    } else if (FILE_PATH_WITHOUT_PREFIX_RE.test(path)) {
      this.basePath = FILE_PATH_WITHOUT_PREFIX_RE.exec(path)![1];
    } else if (FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE.test(path)) {
      this.basePath = FILE_PATH_WITHOUT_PREFIX_WINDOWS_RE.exec(path)![1];
    } else if (FILE_PATH_TIDLE_RE.test(path)) {
      this.basePath = untildify(FILE_PATH_TIDLE_RE.exec(path)![1]);
    } else if (REGISTRY_PATH_VERSION_RE.test(path)) {
      this.basePath = REGISTRY_PATH_VERSION_RE.exec(path)![1];
      this.name = REGISTRY_PATH_VERSION_RE.exec(path)![1];
      this.version = REGISTRY_PATH_VERSION_RE.exec(path)![2];
    } else {
      this.basePath = path;
      this.name = path;
    }
    this.fullPath = path;

    if (FILE_PATH_RE.test(this.fullPath)) {
      const pJson = readPackageJsonSync(this.basePath);
      this.version = pJson.version;
      this.name = pJson.name;
    }
  }

  get isGitPath(): boolean {
    return GIT_PATH_RE.test(this.fullPath);
  }

  get isFilePath(): boolean {
    return FILE_PATH_RE.test(this.fullPath);
  }

  get isRegistryPath(): boolean {
    return !this.isGitPath && !this.isFilePath;
  }

  public same(
    other: PackagePath,
    {
      ignoreVersion,
    }: {
      ignoreVersion?: boolean;
    } = {},
  ) {
    return (
      this.basePath === other.basePath &&
      (ignoreVersion ? true : this.version === other.version)
    );
  }

  public toString(): string {
    return this.fullPath;
  }
}
