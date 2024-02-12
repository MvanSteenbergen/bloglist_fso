module.exports = {
  extends: [
    'eslint-config-airbnb',
  ],
  rules: {
    'linebreak-style': 0,
    'import/no-extraneous-dependencies': ['error', { devDependencies: true, optionalDependencies: false, peerDependencies: false }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
