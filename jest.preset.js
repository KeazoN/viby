const nxPreset = require('@nx/jest/preset').default;
const path = require('path');

module.exports = {
  ...nxPreset,
  setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.js')],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-mmkv|@react-native-community|expo|@expo|socket.io-client)/)',
  ],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/../../../node_modules/react-native',
  },
};
