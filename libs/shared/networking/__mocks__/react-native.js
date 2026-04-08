// Mock React Native for testing
const React = require('react');

const View = 'View';
const Text = 'Text';
const TouchableOpacity = 'TouchableOpacity';
const StyleSheet = {
  create: (styles) => styles,
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
};
