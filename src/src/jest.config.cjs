/**
 * Jest runs the unit suites in tests/unit. Babel is configured here, inline,
 * rather than in a babel.config file: a project-level Babel config would make
 * Next.js abandon its SWC compiler (and next/font) for the app build.
 */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  testMatch: ['**/*.test.js'],
  transform: {
    '^.+\\.[jt]s$': ['babel-jest', {
      configFile: false,
      babelrc: false,
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
    }],
  },
  collectCoverageFrom: ['lib/**/*.ts', '!lib/db/**', '!lib/auth.ts', '!lib/auth-client.ts'],
  coverageReporters: ['text', 'json-summary'],
  // CI fails if coverage of the business logic in lib/ drops below these floors.
  coverageThreshold: { global: { lines: 95, statements: 95, functions: 90, branches: 85 } },
}
