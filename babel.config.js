module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure proper function name preservation
      '@babel/plugin-transform-named-capturing-groups-regex',
      ['@babel/plugin-transform-runtime', { 
        helpers: true,
        regenerator: true
      }],
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-transform-nullish-coalescing-operator',
      'react-native-reanimated/plugin'
    ],
  };
};