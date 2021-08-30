# TypeScript Total Functions - ESLint Plugin

[![Build Status](https://github.com/danielnixon/eslint-plugin-total-functions/actions/workflows/node.js.yml/badge.svg)](https://github.com/danielnixon/eslint-plugin-total-functions/actions/workflows/node.js.yml)
[![Type Coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![Test Coverage](https://codecov.io/gh/danielnixon/eslint-plugin-total-functions/branch/master/graph/badge.svg)](https://codecov.io/gh/danielnixon/eslint-plugin-total-functions)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/danielnixon/eslint-plugin-total-functions/master)
[![Known Vulnerabilities](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions?targetFile=package.json)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/danielnixon/eslint-plugin-total-functions.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/danielnixon/eslint-plugin-total-functions/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/danielnixon/eslint-plugin-total-functions.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/danielnixon/eslint-plugin-total-functions/context:javascript)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/b228d6e8823946978bc94836211ee21b)](https://www.codacy.com/gh/danielnixon/eslint-plugin-total-functions/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=danielnixon/eslint-plugin-total-functions&amp;utm_campaign=Badge_Grade)
[![deepcode](https://www.deepcode.ai/api/gh/badge?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybTEiOiJnaCIsIm93bmVyMSI6ImRhbmllbG5peG9uIiwicmVwbzEiOiJlc2xpbnQtcGx1Z2luLXRvdGFsLWZ1bmN0aW9ucyIsImluY2x1ZGVMaW50IjpmYWxzZSwiYXV0aG9ySWQiOjI4ODQyLCJpYXQiOjE2MTc1MDY0MTJ9.1uzzrYmNoLJRA55dEE_8mQYO4h2G1VYFiHZqobpVvSQ)](https://www.deepcode.ai/app/gh/danielnixon/eslint-plugin-total-functions/_/dashboard?utm_content=gh%2Fdanielnixon%2Feslint-plugin-total-functions)
[![npm](https://img.shields.io/npm/v/eslint-plugin-total-functions.svg)](https://www.npmjs.com/package/eslint-plugin-total-functions)

[![dependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions)
[![devDependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/dev-status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions?type=dev)
[![peerDependencies Status](https://david-dm.org/danielnixon/eslint-plugin-total-functions/peer-status.svg)](https://david-dm.org/danielnixon/eslint-plugin-total-functions?type=peer)

An ESLint plugin to enforce the use of total functions (and prevent the use of [partial functions](https://wiki.haskell.org/Partial_functions)) in TypeScript. If you like your types to tell the truth, this is the ESLint plugin for you.

## Version Matrix

| TypeScript       | ESLint  | eslint-plugin-total-functions | Suppported? |
| :--------------: | :-----: |  :--------------------------: | :---------: |
|  4.4.2           | 7.32.0  | 4.10.0                        |             |
|  4.3.5           | 7.30.0  | 4.8.0                         | No          |
|  4.1.2           | 7.12.0  | 4.7.2                         | No          |
|  4.0.2           | 7.9.0   | 3.3.0                         | No          |

## Installation

```sh
yarn add --dev eslint-plugin-total-functions \
  @typescript-eslint/parser \
  eslint \
  typescript
```

## Setup

### Option 1

Use [eslint-config-typed-fp](https://github.com/danielnixon/eslint-config-typed-fp) which includes this plugin among others.

### Option 2

1. Turn on TypeScript's [strict mode](https://www.typescriptlang.org/tsconfig#strict) and [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess) option.
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
|  require-strict-mode                    | ✅           | ✅    |        |
|  no-unsafe-type-assertion               | ✅           | ✅    |        |
|  no-unsafe-readonly-mutable-assignment  | ✅           | ✅    |        |
|  no-unsafe-mutable-readonly-assignment  |              | ✅    | [Not yet](https://github.com/danielnixon/eslint-plugin-total-functions/issues/99) |
|  no-unsafe-optional-property-assignment | [Not yet](https://github.com/danielnixon/eslint-plugin-total-functions/issues/83) | ✅    |       |
|  no-unsafe-subscript                    | Deprecated   | Deprecated    |        |
|  no-unsafe-destructuring                | Deprecated   | Deprecated    |        |

### total-functions/require-strict-mode

The world is a very strange place when [strict mode](https://www.typescriptlang.org/tsconfig#strict) is disabled. This rule enforces strict mode and [noUncheckedIndexedAccess](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1-beta/#no-unchecked-indexed-access) mode (which is sadly not included under the strict umbrella).

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

### total-functions/no-unsafe-readonly-mutable-assignment

Bans unsafe assignment of readonly values to mutable values (which can lead to surprising mutation in the readonly value). This includes passing readonly values as arguments to functions that expect mutable parameters.

For examples of assignment that this rule considers valid and invalid, see [no-unsafe-readonly-mutable-assignment.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-readonly-mutable-assignment.test.ts).

See [TypeScript issue #13347](https://github.com/microsoft/TypeScript/issues/13347) for a request to fix this at the language level.

### total-functions/no-unsafe-mutable-readonly-assignment

The inverse counterpart to no-unsafe-readonly-mutable-assignment. This rule bans unsafe assignment of mutable values to readonly values (which just like the inverse can lead to surprising mutation in the readonly value).

This rule is often noisy in practice so, unlike no-unsafe-readonly-mutable-assignment, is excluded from the `recommended` config.

Note that the following is considered an assignment from mutable to readonly:

```ts
  type ReadonlyA = { readonly a: string };
  const readonlyA: ReadonlyA = { a: "" };
```

The solution is to append `as const` to the RHS:

```ts
  type ReadonlyA = { readonly a: string };
  const readonlyA: ReadonlyA = { a: "" } as const;
```

For examples of assignment that this rule considers valid and invalid, see [no-unsafe-mutable-readonly-assignment.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-mutable-readonly-assignment.test.ts).

### total-functions/no-unsafe-optional-property-assignment

Optional properties (those with a `?` after their name) interact badly with TypeScript's structural type system in a way that can lead to unsoundness. Example:

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

I find this scenario particularly vexing because it doesn't require type assertions, or plain JS with incorrect \*.d.ts typings, or anything 'loose' like that. You can pull it off with otherwise nicely typed, functional TypeScript (strict mode enabled, no interfaces, no classes, everything readonly, everything const, no type assertions, no plain JS, etc).

This rule bans assignment from one type to another, if:
1. the destination type has an optional property, and
2. the source type has no matching property (either optional or otherwise).

This rule is excluded from the `recommended` config until [#83](https://github.com/danielnixon/eslint-plugin-total-functions/issues/83) lands.


### total-functions/no-unsafe-subscript (deprecated)

Prior to TypeScript 4.1's [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess) option, member access for arrays and records was not type safe. For example:

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

This rule bans unsafe member access. Only use this rule if you are stuck on Typescript < 4.1. This rule is deprecated and excluded from the `recommended` config. It may be removed in the future.

For examples of member access that this rule considers valid and invalid, see [no-unsafe-subscript.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-subscript.test.ts).

### total-functions/no-unsafe-destructuring (deprecated)

Prior to TypeScript 4.1's [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess) option, destructuring arrays and records was not type safe. For example:

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

This rule bans unsafe destructuring. Only use this rule if you are stuck on Typescript < 4.1. This rule is deprecated and excluded from the `recommended` config. It may be removed in the future.

For examples of destructuring that this rule considers valid and invalid, see [no-unsafe-destructuring.test.ts](https://github.com/danielnixon/eslint-plugin-total-functions/blob/master/src/rules/no-unsafe-destructuring.test.ts).

# See Also
* [TypeScript for Functional Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html)
* https://github.com/danielnixon/eslint-config-typed-fp
* https://github.com/danielnixon/readonly-types
* https://github.com/jonaskello/eslint-plugin-functional
* https://github.com/gcanti/fp-ts
* https://github.com/plantain-00/type-coverage
* https://github.com/immutable-js/immutable-js
