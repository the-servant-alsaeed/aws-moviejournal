const baseConfig = require('./jest.config');

module.exports = {
    ...baseConfig,
    coverageDirectory: 'coverage/integration',
    testTimeout: 120000,
    testMatch: ['<rootDir>/**/__tests__/integration/**/*.(spec|test).ts'],
    setupFilesAfterEnv: ['./tests/init-integration-tests.ts']
};
