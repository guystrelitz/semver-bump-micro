const fs = require('fs');
const path = require('path');

// Match a semver number with an optional trailing line ending (LF or CR-LF)
// we're capturing:
// - (major.minor.): (\d+\.\d+\.)
// - (micro): (\d+)
// optional trailing line ending is non-capturing: (?:\r?\n)?
const semVerPattern = /^(\d+)\.(\d+)\.(\d+)(?:\r?\n)?$/;

function bumpVersion() {
  try {
    // Read the target file
    console.log(`GITHUB_WORKSPACE: ${process.env.GITHUB_WORKSPACE}`);
    console.log(`INPUT_TARGET_DIRECTORY: ${process.env.INPUT_TARGET_DIRECTORY}`);
    console.log(`INPUT_TARGET_FILE: ${process.env.INPUT_TARGET_FILE}`);
    const targetFile = path.join(
      process.env.GITHUB_WORKSPACE,
      process.env.INPUT_TARGET_DIRECTORY,
      process.env.INPUT_TARGET_FILE
    );
    console.log(`Target file: ${targetFile}`);
    const oldSemVer = fs.readFileSync(targetFile, 'utf8');
    console.log(`Target file contents: "${oldSemVer}"`);

    // Increment value
    const match = oldSemVer.match(semVerPattern);
    if  (match === null) {
      throw new Error('Invalid target file contents');
    }
    console.log('Matched target file version');

    let [major, minor, micro] = match.slice(1);

    if (process.env.INPUT_BUMP_TYPE === 'bump_major') {
      major = Number(major) + 1;
      minor = 0;
      micro = 0;
    } else {
      micro = Number(micro) + 1;
    }
    const newSemVer = `${major}.${minor}.${micro}`;

    // Write the target file
    fs.writeFileSync(targetFile, newSemVer, 'utf8');
    console.log(`Incremented the semantic version from ${oldSemVer} to ${newSemVer}.`);
    process.exit(0);
  } catch (e) {
    console.log('Failed to increment the semantic version:', e.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  bumpVersion();
}

module.exports = bumpVersion;