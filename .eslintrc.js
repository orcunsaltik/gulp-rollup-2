module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: ['standard', 'plugin:node/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'space-before-function-paren': 'off',
    'comma-dangle': ['error', 'only-multiline'],
    semi: ['error', 'always'],
  },
};
