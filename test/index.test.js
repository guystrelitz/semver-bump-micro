const fs = require('fs');
const path = require('path');
const bumpVersion = require('../src/index.js');

// Mock fs module
jest.mock('fs');

describe('bumpVersion', () => {
  let writeFileSyncSpy, exitSpy, consoleErrorSpy;

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
    consoleErrorSpy = jest.spyOn(console, 'error');

    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GITHUB_WORKSPACE;
    delete process.env.INPUT_TARGET_DIRECTORY;
    delete process.env.INPUT_TARGET_FILE;

    // Clean up spies
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('happy path: valid version formats', () => {
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
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        path.join('/fake/workspace', '.', 'semver'),
        expected,
        'utf8'
      );

      // Verify process.exit was called with success code
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('exception path: invalid version formats', () => {
    test.each([
      '1.2',           // Missing patch
      '1.2.3.4',       // Too many parts
      'v1.2.3',        // Has prefix
      '1.2.3-beta',    // Has suffix
      '1.2.3\n',       // Has newline
      ' 1.2.3 ',       // Has whitespace
      '1.2.3\nother',  // Has additional content
    ])('should fail to bump version %s', (input) => {
      // Mock fs.readFileSync to return the invalid version
      fs.readFileSync.mockReturnValue(input);

      // Run the production code
      bumpVersion();

      // Verify fs.writeFileSync was NOT called
      expect(writeFileSyncSpy).not.toHaveBeenCalled();

      // Verify console.error was called with error message
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to increment the semantic version:',
        expect.stringContaining('does not record a valid semantic version')
      );

      // Verify process.exit was called with error code
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});