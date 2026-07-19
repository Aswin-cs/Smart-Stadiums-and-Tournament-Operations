const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^bson$': require.resolve('bson'),
  },
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{js,jsx}',
    'lib/**/*.{js,jsx}',
    'models/**/*.{js,jsx}',
    '!app/layout.js',
    '!app/globals.css',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = async () => {
  const nextJestConfig = await createJestConfig(customJestConfig)();
  
  // Allow Jest to transpile ESM packages inside node_modules
  nextJestConfig.transformIgnorePatterns = [
    '/node_modules/(?!(jose|@panva|openid-client|next-auth)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ];
  
  return nextJestConfig;
};
