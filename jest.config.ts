/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https:
 */

export default {
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: './jsdom-test-environment.js',
      clearMocks: true,
      globals: {
        'ts-jest': {
          tsconfig: './tsconfig.spec.json',
        },
      },
      preset: 'ts-jest',
      testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
      // testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      clearMocks: true,
      globals: {
        'ts-jest': {
          tsconfig: 'tsconfig.spec.json',
        },
      },
      preset: 'ts-jest',
      testPathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
    },
    {
      displayName: 'electron',
      runner: '@jest-runner/electron',
      testEnvironment: '@jest-runner/electron/environment',
      transform: { '\\.ts$': 'ts-jest' },
    },
  ],
};
