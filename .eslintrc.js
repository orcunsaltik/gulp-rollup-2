module.exports = {
  env: {
    node: true,
    es2022: true
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    indent: ['error', 2],
    'space-before-function-paren': ['error', 'never'],
    'no-unused-vars': 'warn'
  }
};
