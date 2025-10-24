const fs = require('fs');
const path = require('path');
const bumpVersion = require('../src/index.js');

// Mock fs module
jest.mock('fs');

describe('bumpVersion', () => {
  let writeFileSyncSpy, exitSpy, consoleLogSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.GITHUB_WORKSPACE = '/fake/workspace';
    process.env.INPUT_TARGET_DIRECTORY = '.';
    process.env.INPUT_TARGET_FILE = 'semver';

    // Set up spies that are the same for all tests
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  // Helper function to verify writeFileSync was called with expected version
  const expectWriteVersionFileWith = (expectedVersion) => {
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join('/fake/workspace', '.', 'semver'),
      expectedVersion,
      'utf8'
    );
  };

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GITHUB_WORKSPACE;
    delete process.env.INPUT_TARGET_DIRECTORY;
    delete process.env.INPUT_TARGET_FILE;

    // Clean up spies and mock
    exitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    fs.readFileSync.mockReset();
  });

  describe('happy path', () => {
    describe('minor bump of valid version formats', () => {
      test.each([
        { input: '1.2.3', expected: '1.2.4' },
        { input: '0.0.0', expected: '0.0.1' },
        { input: '10.20.30', expected: '10.20.31' },
        { input: '1.0.9', expected: '1.0.10' },
      ])('should bump version from $input to $expected', ({ input, expected }) => {
        // Mock fs.readFileSync to return the input version
        fs.readFileSync.mockReturnValue(input);

        // Run the production code
        bumpVersion();

        // Verify fs.writeFileSync was called with correct path and new version
        expectWriteVersionFileWith(expected);

        // Verify process.exit was called with success code
        expect(exitSpy).toHaveBeenCalledWith(0);
      });
    });  // describe 'valid version formats'

    describe('is tolerant to trailing line ending', () => {
      test.each([
        {input: '1.2.3\n', description: 'LF'},
        {input: '1.2.3\r\n', description: 'CR-LF'},
      ])('should strip trailing $description', ({input, description}) => {
        // Mock fs.readFileSync to return the input version
        fs.readFileSync.mockReturnValue(input);

        // Run the production code
        bumpVersion();

        // new version is persisted WITHOUT the trailing newline
        expectWriteVersionFileWith('1.2.4');

        // Verify process.exit was called with success code
        expect(exitSpy).toHaveBeenCalledWith(0);
      });
    });  // describe 'is tolerant to trailing newline'

  });  // describe('happy path'

  describe('bump major and minor versions', () => {
    test('bump major version', () => {
      // Mock fs.readFileSync to return the initial version
      fs.readFileSync.mockReturnValue('1.2.3');

      // Run the production code with bump_type input
      process.env.INPUT_BUMP_TYPE = 'bump_major';
      bumpVersion();

      expectWriteVersionFileWith('2.0.0');
    });  // test 'bump major version'

    test('bump minor version', () => {
      // Mock fs.readFileSync to return the initial version
      fs.readFileSync.mockReturnValue('1.2.3');

      // Run the production code with bump_type input
      process.env.INPUT_BUMP_TYPE = 'bump_minor';
      bumpVersion();

      expectWriteVersionFileWith('1.3.0');
    });  // test 'bump minor version'
  });  // describe 'bump major and minor versions'

  describe('exception path', () => {

    describe('invalid version formats do not alter the version file', () => {
      test.each([
        '1.2',           // Missing patch
        '1.2.3.4',       // Too many parts
        'v1.2.3',        // Has prefix
        '1.2.3-beta',    // Has suffix
        ' 1.2.3 ',       // Has whitespace
        '1.2.3\nother',  // Has additional content
      ])('should fail to bump version %s', (input) => {
        // Mock fs.readFileSync to return the invalid version
        fs.readFileSync.mockReturnValue(input);

        // Run the production code
        bumpVersion();

        // Verify fs.writeFileSync was NOT called
        expect(writeFileSyncSpy).not.toHaveBeenCalled();

        // Verify process.exit was called with error code
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });  // describe 'invalid version formats'

    test('console output for invalid version format', () => {
      // Mock fs.readFileSync to return invalid content
      fs.readFileSync.mockReturnValue('hello');

      // Run the production code
      bumpVersion();

      // Verify appropriate logging
      expect(consoleLogSpy).toHaveBeenCalledWith('Target file contents: "hello"');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Failed to increment the semantic version:',
        'Invalid target file contents');

      // do not expect a bare invalid consolemessage – it's included in the call above
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Invalid target file contents');
    });  // describe 'console output'

    test('input file does not exist', () => {
      // Set up environment to point to a nonexistent file
      process.env.INPUT_TARGET_DIRECTORY = '.';
      process.env.INPUT_TARGET_FILE = 'nonexistent-semver';

      bumpVersion();

      expect(exitSpy).toHaveBeenCalledWith(1);

      // the file read is undefined
      // leading to an exception when we try to match it to the version pattern
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Failed to increment the semantic version:',
        "Cannot read properties of undefined (reading 'match')");
    });

  });  // describe 'exception path'
});