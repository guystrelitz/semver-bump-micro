// const { Toolkit } = require('actions-toolkit');
const fs = require('fs');
const path = require('path');

const semVerPattern = /^(\d+\.\d+\.)(\d+)/

try {
  // Read the target file
  const targetFile = path.join(
    process.env.GITHUB_WORKSPACE,
    process.env.INPUT_TARGET_DIRECTORY,
    process.env.INPUT_TARGET_FILE
  );
  console.log(`Target file: ${targetFile}`);
  const oldSemVer = fs.readFileSync(targetFile, 'utf8');

  // Increment value
  const match = oldSemVer.match(semVerPattern);
  if  (match === null) {
    throw new Error(`${targetFile} does not record a valid semantic version.`);
  }

  const majorMinor = match[1];
  const oldMicro = match[2];
  const newMicro = Number(oldMicro) + 1;
  const newSemVer = majorMinor + newMicro;

  // Write the target file
  fs.writeFileSync(targetFile, newSemVer, 'utf8');
  console.log(`Incremented the semantic version from ${oldSemVer} to ${newSemVer}.`);
  
  console.log('Version bump completed successfully');
  process.exit(0);
} catch (e) {
  console.error('Failed to increment the semantic version:', e.message);
  process.exit(1);
}
