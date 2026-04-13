export default {
  displayName: '@viby/shared/security',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/security',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transformIgnorePatterns: ['node_modules/(?!(react-native|@sentry/react-native)/)'],
};
