module.exports = {
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['coverage/', 'dist/', 'vitest.config.ts'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
    'plugin:prettier/recommended'
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    'comma-style': ['error', 'last'],
    'comma-dangle': ['error', 'never'],
    'no-use-before-define': ['error', { functions: true, classes: true, variables: false }],
    'max-len': ['error', { code: 150 }],
    semi: ['error', 'always'],
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off'
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['error']
      }
    }
  ]
};
