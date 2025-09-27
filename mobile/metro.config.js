const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add the local mopro-react-native-package to the watchFolders
config.watchFolders = [
  path.resolve(__dirname, "../mopro-react-native-package"),
];

// Add the local package to the resolver
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../mopro-react-native-package/node_modules"),
];

module.exports = config;
