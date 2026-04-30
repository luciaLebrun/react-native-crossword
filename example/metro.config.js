const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const pak = require('../package.json');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the library source for live changes
config.watchFolders = [libraryRoot];

// Resolve the library's peer deps from the example's node_modules only
// This prevents the parent's devDeps (which may be different versions) from leaking in
const modules = [
  ...Object.keys(pak.peerDependencies || {}),
  ...Object.keys(pak.peerDependenciesMeta || {}),
  'react-native',
  'react',
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

config.resolver.extraNodeModules = modules.reduce((acc, name) => {
  acc[name] = path.resolve(projectRoot, 'node_modules', name);
  return acc;
}, {});

// Map the library name to the parent source directory
config.resolver.extraNodeModules['react-native-crossword'] = libraryRoot;

module.exports = config;
