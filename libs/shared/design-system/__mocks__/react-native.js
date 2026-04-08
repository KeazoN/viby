import React from 'react';

// Mock React Native components
const View = ({ children, ...props }) => React.createElement('View', props, children);
const Text = ({ children, ...props }) => React.createElement('Text', props, children);
const TouchableOpacity = ({ children, onPress, ...props }) =>
  React.createElement('TouchableOpacity', { ...props, onClick: onPress }, children);
const TextInput = (props) => React.createElement('TextInput', props);
const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props);
const Image = (props) => React.createElement('Image', props);
const StyleSheet = {
  create: (styles) => styles,
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
};
