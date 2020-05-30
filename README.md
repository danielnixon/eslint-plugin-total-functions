# TypeScript Total Functions - ESLint Plugin

[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions?targetFile=package.json)
[![npm](https://img.shields.io/npm/v/eslint-plugin-total-functions.svg)](https://www.npmjs.com/package/eslint-plugin-total-functions)

[![dependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions)
[![devDependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/dev-status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions?type=dev)

An ESLint plugin to enforce the use of total functions (and prevent the use of partial functions) in TypeScript.

## Installation

```sh
# yarn
yarn add eslint-plugin-total-functions

# npm
npm install eslint-plugin-total-functions
```

## Setup

Update your `.eslintrc.js`:

```diff
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2018,
    sourceType: "module"
  },
  extends: [
+    "plugin:total-functions/recommended",
  ],
  plugins: [
+    "total-functions",
  ],
};

```
