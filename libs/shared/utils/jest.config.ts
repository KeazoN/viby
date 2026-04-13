export default {
  displayName: '@viby/shared/utils',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/utils',
  testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/*.property.test.ts'],
};
