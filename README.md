# TypeScript Total Functions - ESLint Plugin

[![Build Status](https://travis-ci.org/danielnixon/eslint-plugin-total-functions.svg?branch=master)](https://travis-ci.org/danielnixon/eslint-plugin-total-functions)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions?targetFile=package.json)
[![npm](https://img.shields.io/npm/v/eslint-plugin-total-functions.svg)](https://www.npmjs.com/package/eslint-plugin-total-functions)

[![dependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions)
[![devDependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/dev-status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions?type=dev)

An ESLint plugin to enforce the use of total functions (and prevent the use of [partial functions](https://wiki.haskell.org/Partial_functions)) in TypeScript.

Intended to be used with [strictNullChecks](https://www.typescriptlang.org/docs/handbook/compiler-options.html) enabled.

## Installation

```sh
# yarn
yarn add --dev eslint-plugin-total-functions

# npm
npm install eslint-plugin-total-functions --save-dev
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

Alternatively you can configure individual rules separately (see below).

## Rules

### total-functions/no-array-subscript

Bans unsafe array subscript access. See [TypeScript issue #13778](https://github.com/Microsoft/TypeScript/issues/13778) for the corresponding issue and [total-functions](https://github.com/danielnixon/total-functions#get-type-safe-array-index-operator) for a safe (total) alternative.

Tuples and (non-record) objects are allowed.

There are other ways to avoid this issue, such as [fp-ts's lookup](https://gcanti.github.io/fp-ts/modules/Array.ts.html#lookup), but the `get` function from total-functions is smart enough to exclude `undefined` when dealing with tuples and objects.

### total-functions/no-array-destructuring

Bans unsafe array and object destructuring. Destructuring tuples is allowed, as long as you're within the length of the tuple.

# See Also
* https://github.com/danielnixon/readonly-types
* https://github.com/danielnixon/total-functions
* https://github.com/jonaskello/eslint-plugin-functional
* https://github.com/gcanti/fp-ts
