# TypeScript Total Functions - ESLint Plugin

[![Build Status](https://travis-ci.org/danielnixon/eslint-plugin-total-functions.svg?branch=master)](https://travis-ci.org/danielnixon/eslint-plugin-total-functions)
[![Type Coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![Test Coverage](https://codecov.io/gh/danielnixon/eslint-plugin-total-functions/branch/master/graph/badge.svg)](https://codecov.io/gh/danielnixon/eslint-plugin-total-functions)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/danielnixon/eslint-plugin-total-functions/master)
[![Known Vulnerabilities](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions?targetFile=package.json)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/danielnixon/eslint-plugin-total-functions.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/danielnixon/eslint-plugin-total-functions/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/danielnixon/eslint-plugin-total-functions.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/danielnixon/eslint-plugin-total-functions/context:javascript)
[![npm](https://img.shields.io/npm/v/eslint-plugin-total-functions.svg)](https://www.npmjs.com/package/eslint-plugin-total-functions)

[![dependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions)
[![devDependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/dev-status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions?type=dev)
[![peerDependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/peer-status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions?type=peer)

An ESLint plugin to enforce the use of total functions (and prevent the use of [partial functions](https://wiki.haskell.org/Partial_functions)) in TypeScript. If you like your types to tell the truth, this is the ESLint plugin for you.

## Installation

```sh
# yarn
yarn add --dev eslint-plugin-total-functions

# npm
npm install eslint-plugin-total-functions --save-dev
```

## Setup

### Option 1

Use [eslint-config-typed-fp](https://github.com/danielnixon/eslint-config-typed-fp) which includes this plugin among others.

### Option 2

1. Turn on TypeScript's [strict mode](https://www.typescriptlang.org/tsconfig#strict).
2. Set up [ESLint + TypeScript](https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md).
3. Turn on [eslint-plugin-functional](https://github.com/jonaskello/eslint-plugin-functional) (recommended). Its rules related to mutation and OO are more important than this plugin's rules and they'll help keep your types honest.
4. Update your `.eslintrc.js`:

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

| Rule                                    | Recommended  | All   | Fixer? |
| :-------------------------------------: | :----------: | :---: | :----: |
|  no-unsafe-subscript                    | ✅           | ✅    |        |
|  no-unsafe-destructuring                | ✅           | ✅    |        |
|  no-unsafe-type-assertion               | ✅           | ✅    |        |
|  no-unsafe-assignment                   | ✅           | ✅    |        |
|  require-strict-mode                    | ✅           | ✅    |        |
|  no-unsafe-optional-property-assignment | [Not yet](https://github.com/danielnixon/eslint-plugin-total-functions/issues/83) | ✅    |        |

### total-functions/no-unsafe-subscript

Bans unsafe array and object member access, for example:

```typescript
const a: string[] = [];
const b = a[0]; // b has type string, not string | undefined as you might expect
b.toUpperCase(); // This explodes at runtime

const record: Record<string, string> = { foo: "foo" };
const bar = record["bar"]; // bar has type string, not string | undefined
bar.toUpperCase(); // This explodes at runtime

const baz = record.baz; // baz has type string, not string | undefined
baz.toUpperCase(); // This explodes at runtime

const str = "";
const s = str[0]; // s has type string, not string | undefined
s.toUpperCase(); // This explodes at runtime
```

See [TypeScript issue #13778](https://github.com/Microsoft/TypeScript/issues/13778) for the corresponding issue and [total-functions](https://github.com/danielnixon/total-functions#get-type-safe-array-index-operator) for a safe (total) alternative.

Tuples and non-record objects (no index signature) are allowed. Records are allowed if their value type includes `undefined`.

There are other ways to avoid this issue, such as [fp-ts's lookup](https://gcanti.github.io/fp-ts/modules/Array.ts.html#lookup), but the `get` function from total-functions is smart enough to exclude `undefined` when dealing with tuples and objects.

For examples of member access that this rule considers valid and invalid, see [no-unsafe-subscript.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-subscript.test.ts).

### total-functions/no-unsafe-destructuring

Bans unsafe array and object destructuring, for example:

```typescript
const array: readonly string[] = [];
const [foo] = array; // foo has type string, not string | undefined
foo.toUpperCase(); // This explodes at runtime

const obj: Record<string, string> = { a: "a" };
const { b } = obj; // b has type string, not string | undefined
b.toUpperCase(); // This explodes at runtime

const str = "";
const [bar] = str; // bar has type string, not string | undefined
bar.toUpperCase(); // This explodes at runtime
```

Destructuring tuples is allowed, as long as you're within the length of the tuple.

For examples of destructuring that this rule considers valid and invalid, see [no-unsafe-destructuring.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-destructuring.test.ts).

### total-functions/no-unsafe-type-assertion

Bans unsafe type assertions, for example:

```typescript
type Foo = { readonly bar: number };
const foo = {} as Foo; // This compiles
foo.bar.toString(); // This explodes at runtime
```

This is similar to the [consistent-type-assertions](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md) rule from [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin), however:

1. this rule is _weaker_ than `consistent-type-assertions` with its `assertionStyle` option set to `never` -- this rule will permit type assertions that it considers safe as opposed to blanket banning all type assertions, and
2. this rule is _stronger_ than `consistent-type-assertions` with its `objectLiteralTypeAssertions` option set to `never`, for example:

```typescript
type Foo = { readonly bar: number };
const foo = {};
const foo2 = foo as Foo; // Flagged by this rule, but not by consistent-type-assertions (unless you set assertionStyle to never)
foo2.bar.toString(); // This explodes at runtime
```

For examples of type assertions that this rule considers valid and invalid, see [no-unsafe-type-assertion.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-type-assertion.test.ts).

See [TypeScript issue #7481](https://github.com/microsoft/TypeScript/issues/7481) for a request to fix this at the language level.

### total-functions/no-unsafe-assignment

Bans unsafe assignment of readonly values to mutable values (which can lead to surprising mutation in the readonly value). This includes passing readonly values as arguments to functions that expect mutable parameters.

For examples of assignment that this rule considers valid and invalid, see [no-unsafe-assignment.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-assignment.test.ts).

See [TypeScript issue #13347](https://github.com/microsoft/TypeScript/issues/13347) for a request to fix this at the language level.

See also:
* https://github.com/danielnixon/eslint-plugin-total-functions/issues/21
* https://github.com/jonaskello/eslint-plugin-functional/issues/113

### total-functions/require-strict-mode

The world is a very strange place when [strict mode](https://www.typescriptlang.org/tsconfig#strict) is disabled. This rule enforces strict mode.

### total-functions/no-unsafe-optional-property-assignment

Optional properties (those with a `?` after their name) interact badly with TypeScript's structural type system which can lead to unsoundness. Example:

```ts
type Foo = { readonly foo: string };
type Bar = Foo & { readonly bar?: () => unknown };

const thing = { foo: "foo", bar: "bar" };
const foo: Foo = thing;
const bar: Bar = foo;

if (bar.bar !== undefined) {
    bar.bar(); // explodes at runtime
}
```

This rule bans assignment from one type to another, if:
1. the destination type has an optional property, and
2. the source type has no matching property (either optional or otherwise).

# See Also
* [TypeScript for Functional Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html)
* https://github.com/danielnixon/eslint-config-typed-fp
* https://github.com/danielnixon/readonly-types
* https://github.com/danielnixon/total-functions
* https://github.com/jonaskello/eslint-plugin-functional
* https://github.com/gcanti/fp-ts
* https://github.com/plantain-00/type-coverage
* https://github.com/immutable-js/immutable-js
