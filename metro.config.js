const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Some deps (zustand) ship an ESM entry using `import.meta`, which breaks in
// Metro's web output. Prefer the CJS ("require") entry from package exports.
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;
