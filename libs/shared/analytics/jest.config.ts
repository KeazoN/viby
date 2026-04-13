export default {
  displayName: '@viby/shared/analytics',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/analytics',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transformIgnorePatterns: ['node_modules/(?!(react-native)/)'],
};
