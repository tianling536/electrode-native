import { PackagePath } from 'ern-core';

export interface CompositeGeneratorConfig {
  /**
   * Base Composite
   */
  baseComposite?: PackagePath;
  /**
   * Additional JavaScript dependencies to add to the Composite
   */
  extraJsDependencies?: PackagePath[];
  /**
   * JS API implementations that should be included in the generated Composite
   */
  jsApiImplDependencies?: PackagePath[];
  /**
   *  MiniApps that should be included in the generated Composite
   */
  miniApps: PackagePath[];
  /**
   * The output directory where to generate the Composite
   */
  outDir: string;
  /**
   * Path to the current Composite yarn lock
   */
  pathToYarnLock?: string;
  /**
   * 1:1 mapping to resolutions field of composite package.json
   * https://yarnpkg.com/lang/en/docs/selective-version-resolutions
   * Can be used to force the version of selected packages
   */
  resolutions?: { [pkg: string]: string };
  /**
   * Which other node_modules to include besides the ones relative to the
   * project directory. This is keyed by dependency name.
   * https://facebook.github.io/metro/docs/configuration/#extranodemodules
   */
  metroExtraNodeModules?: { [pkg: string]: string };
}
