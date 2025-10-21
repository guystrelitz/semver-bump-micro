const fs = require('fs');
const path = require('path');

const semVerPattern = /^(\d+\.\d+\.)(\d+)$/;

function bumpVersion() {
  try {
    // Read the target file
    console.log(process.env);
    console.log(`GITHUB_WORKSPACE: ${process.env.GITHUB_WORKSPACE}`);
    console.log(`INPUT_TARGET_DIRECTORY: ${process.env.INPUT_TARGET_DIRECTORY}`);
    console.log(`INPUT_TARGET_FILE: ${process.env.INPUT_TARGET_FILE}`);
    const targetFile = path.join(
      process.env.GITHUB_WORKSPACE,
      process.env.INPUT_TARGET_DIRECTORY,
      process.env.INPUT_TARGET_FILE
    );
    console.log(`Target file: ${targetFile}`);
    let oldSemVer;
    try {
      oldSemVer = fs.readFileSync(targetFile, 'utf8');
    } catch (e) {
      throw new Error(`Failed to read target file: ${e.message}`);
    }
    console.log(`Target file contents: "${oldSemVer}"`);

    // Increment value
    const match = oldSemVer.match(semVerPattern);
    if  (match === null) {
      throw new Error(`Invalid target file contents`);
    }

    const majorMinor = match[1];
    const oldMicro = match[2];
    const newMicro = Number(oldMicro) + 1;
    const newSemVer = majorMinor + newMicro;

    // Write the target file
    fs.writeFileSync(targetFile, newSemVer, 'utf8');
    console.log(`Incremented the semantic version from ${oldSemVer} to ${newSemVer}.`);
    process.exit(0);
  } catch (e) {
    console.error('Failed to increment the semantic version:', e.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  bumpVersion();
}

module.exports = bumpVersion;