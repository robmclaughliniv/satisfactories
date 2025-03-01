const { exec } = require('child_process');

describe('Migration Scripts', () => {
  // Increase timeout in case migrations take longer in dry-run mode
  jest.setTimeout(15000);

  it('should run migrate.js in dry-run mode successfully', (done) => {
    // Execute migrate.js with the --dry-run flag.
    exec('node scripts/migrate.js --dry-run', { cwd: process.cwd() }, (error, stdout, stderr) => {
      // Expect no error.
      expect(error).toBeNull();
      // Check that output contains an indication of a dry run.
      expect(stdout.toLowerCase()).toMatch(/dry run/);
      done();
    });
  });

  it('should run migrateData.js in dry-run mode successfully', (done) => {
    // Execute migrateData.js with the --dry-run flag.
    exec('node scripts/migrateData.js --dry-run', { cwd: process.cwd() }, (error, stdout, stderr) => {
      // Expect no error.
      expect(error).toBeNull();
      // Validate that the output indicates a dry run.
      expect(stdout.toLowerCase()).toMatch(/dry run/);
      done();
    });
  });
});
