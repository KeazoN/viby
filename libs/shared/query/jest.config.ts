export default {
  displayName: '@viby/shared/query',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/query',
  testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/*.property.test.ts'],
  transformIgnorePatterns: ['node_modules/(?!(@tanstack)/)'],
};
