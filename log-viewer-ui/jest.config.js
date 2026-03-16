const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './lib/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './hooks/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './components/**/*.tsx': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(next)/)',
  ],
}

module.exports = createJestConfig(customJestConfig)
