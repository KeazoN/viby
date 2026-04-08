export default {
  displayName: '@viby/shared/storage',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/storage',
  testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/*.property.test.ts'],
  transformIgnorePatterns: ['node_modules/(?!(react-native|react-native-mmkv)/)'],
};
