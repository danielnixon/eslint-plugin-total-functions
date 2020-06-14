# TypeScript Total Functions - ESLint Plugin

[![Build Status](https://travis-ci.org/danielnixon/eslint-plugin-total-functions.svg?branch=master)](https://travis-ci.org/danielnixon/eslint-plugin-total-functions)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions?targetFile=package.json)
[![npm](https://img.shields.io/npm/v/eslint-plugin-total-functions.svg)](https://www.npmjs.com/package/eslint-plugin-total-functions)

[![dependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions)
[![devDependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/dev-status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions?type=dev)

An ESLint plugin to enforce the use of total functions (and prevent the use of [partial functions](https://wiki.haskell.org/Partial_functions)) in TypeScript. If you like your types to tell the truth, this is the ESLint plugin for you.

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

Bans unsafe array and object subscript access, for example:

```typescript
const a: object[] = [];
const b = a[0]; // b has type object, not object | undefined as you might expect
b.toString(); // This explodes at runtime

const record: Record<string, string> = { foo: "foo" };
const bar = record["bar"]; // bar has type string, not string | undefined
bar.toUpperCase(); // This explodes at runtime
```

See [TypeScript issue #13778](https://github.com/Microsoft/TypeScript/issues/13778) for the corresponding issue and [total-functions](https://github.com/danielnixon/total-functions#get-type-safe-array-index-operator) for a safe (total) alternative.

Tuples and (non-record) objects are allowed.

There are other ways to avoid this issue, such as [fp-ts's lookup](https://gcanti.github.io/fp-ts/modules/Array.ts.html#lookup), but the `get` function from total-functions is smart enough to exclude `undefined` when dealing with tuples and objects.

For examples of subscript access that this rule considers valid and invalid, see [no-array-subscript.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-array-subscript.test.ts).

### total-functions/no-array-destructuring

Bans unsafe array and object destructuring, for example:

```typescript
const array: readonly number[] = [];
const [foo] = array; // foo has type number, not number | undefined
foo.toString(); // This explodes at runtime

const obj: Record<string, string> = { a: "a" };
const { b } = obj; // b has type string, not string | undefined
b.toUpperCase(); // This explodes at runtime
```

Destructuring tuples is allowed, as long as you're within the length of the tuple.

For examples of destructuring that this rule considers valid and invalid, see [no-array-destructuring.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-array-destructuring.test.ts).

### total-functions/no-unsafe-type-assertion

Bans unsafe type assertions, for example:

```typescript
type Foo = { readonly bar: number };
const foo = {} as Foo; // This compiles
foo.bar.toString(); // This explodes at runtime
```

This is similar to the [consistent-type-assertions](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md) rule from [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) (assuming you have the [objectLiteralTypeAssertions](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md#objectliteraltypeassertions) option set appropriately) but it goes even further than that rule. For example, the following will _not_ be flagged by `consistent-type-assertions` (even with `objectLiteralTypeAssertions: "never"`) but will be flagged by `no-unsafe-type-assertion`:

```typescript
type Foo = { readonly bar: number };
const foo = {};
const foo2 = foo as Foo; // Flagged by this rule, but not by consistent-type-assertions
foo2.bar.toString(); // This explodes at runtime
```

For examples of type assertions that this rule considers valid and invalid, see [no-unsafe-type-assertion.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-type-assertion.test.ts).

Note that this rule is not (yet?) included in the `recommended` config, so you'll have to enable it individually in your ESLint config. So this project's own ESLint config for an example.

See [TypeScript issue #7481](https://github.com/microsoft/TypeScript/issues/7481).

# See Also
* https://github.com/danielnixon/readonly-types
* https://github.com/danielnixon/total-functions
* https://github.com/jonaskello/eslint-plugin-functional
* https://github.com/gcanti/fp-ts
* https://github.com/plantain-00/type-coverage
