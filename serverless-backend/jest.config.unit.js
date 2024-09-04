const base = require('./jest.config.js');

module.exports = {
    ...base,
    coverageDirectory: 'coverage/unit',
    setupFilesAfterEnv: ['./tests/init-unit-tests.ts'],
    testMatch: ['<rootDir>/**/__tests__/unit/**/*.(spec|test).ts']
};
