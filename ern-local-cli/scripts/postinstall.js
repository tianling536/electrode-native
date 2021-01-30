#!/usr/bin/env node
const childProcess = require('child_process');
const execSync = childProcess.execSync;
const fs = require('fs');
const path = require('path');
const os = require('os');

//
// Directory structure (stored in user home directory)
//
// .ern
// |_ ern-master-manifest (git)
// |_ versions
//   |_ 0.5.0
//   |_ 0.5.1
// ....
// |_ .ernrc

const pJsonPath = path.resolve(__dirname, '..', 'package.json');
const pJson = JSON.parse(fs.readFileSync(pJsonPath, { encoding: 'utf8' }));

const PLATFORM_VERSION = pJson.version;
// Path to ern platform root directory
const ERN_PATH = process.env['ERN_HOME'] || path.join(os.homedir(), '.ern');
// Path to ern global configuration file
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_PATH, '.ernrc');
// Path to ern platform manifest repo
const ERN_MANIFEST_REPO_PATH = path.join(ERN_PATH, 'ern-master-manifest');
// Remote git path to ern manifest repo
const ERN_MANIFEST_DEFAULT_GIT_REPO =
  'https://github.com/electrode-io/electrode-native-manifest.git';

if (!isGitInstalled()) {
  throw new Error(
    'git is not installed on this machine ! Please install git and retry.',
  );
}

// Clone ern manifest repository if not done already
if (!fs.existsSync(ERN_MANIFEST_REPO_PATH)) {
  console.log('Cloning electrode-native master manifest');
  execSync(
    `git clone ${ERN_MANIFEST_DEFAULT_GIT_REPO} ${ERN_MANIFEST_REPO_PATH}`,
  );
}

// Generate initial ernrc file, if it doesnt already exists (i.e if this is not a first time platform install)
if (!fs.existsSync(ERN_RC_GLOBAL_FILE_PATH)) {
  console.log(`=> Creating initial .ernrc configuration file`);
  const ernRc = {
    platformVersion: PLATFORM_VERSION,
  };
  fs.writeFileSync(ERN_RC_GLOBAL_FILE_PATH, JSON.stringify(ernRc, null, 2));
} else {
  // TODO : Handle case where .ernrc global file already exists if needed
  // (meaning that at least one version of ern platform) is already installled.
  // We should probably just patch the .ernrc file with any new configuration data introduced in this version
}

function isGitInstalled() {
  try {
    execSync('git --version');
    return true;
  } catch (e) {
    return false;
  }
}

console.log(`=== Hurray ! Platform installed @ v${PLATFORM_VERSION}`);
