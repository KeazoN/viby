#!/usr/bin/env node
const { execSync } = require('child_process');

try {
  console.log('Running notification integration tests...\n');
  execSync(
    'npx jest --config=libs/shared/notifications/jest.config.js --testPathPattern=notifications.integration.test.ts --no-cache --verbose',
    { stdio: 'inherit', cwd: __dirname }
  );
  console.log('\n✅ Tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed');
  process.exit(1);
}
