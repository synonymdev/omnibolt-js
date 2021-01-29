module.exports = {
  parser: "babel-eslint",
  env: {
    es6: true,
    node: true,
    browser: true,
    commonjs: true
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  extends: ["eslint:recommended"],
  rules: {
    "no-console": 0,
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-buffer-constructor": 0,
    "no-case-declarations": 0,
    "no-useless-escape": 0,
    semi: 2,
    "no-undef": 0,
    "require-atomic-updates": 0,
    "no-async-promise-executor": 0,
    "multiline-comment-style": 0,
    "no-unused-vars": 0
  },
  globals: {
    fetch: false
  }
};
