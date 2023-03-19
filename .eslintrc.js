module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2018,
    sourceType: "module",
  },
  extends: [
    "typed-fp",
    "plugin:sonarjs/recommended",
    "plugin:jest/recommended",
    "plugin:prettier/recommended",
  ],
  env: {
    "jest/globals": true,
    es6: true,
  },
  plugins: [
    "jest",
    "sonarjs",
    "functional",
    "@typescript-eslint",
    "prettier",
    "total-functions",
  ],
  rules: {
    "total-functions/no-unsafe-mutable-readonly-assignment": "error",
    "total-functions/no-hidden-type-assertions": "error",
  },
  ignorePatterns: [
    "dist/*",
    "coverage/*",
    ".eslintrc.js",
    "stryker.conf.js",
    "jest.config.js",
  ],
};
