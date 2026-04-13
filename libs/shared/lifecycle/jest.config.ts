export default {
  displayName: '@viby/shared/lifecycle',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/lifecycle',
  testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/*.property.test.ts'],
};
