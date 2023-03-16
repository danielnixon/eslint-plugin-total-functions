# TypeScript Total Functions - ESLint Plugin

[![Build Status](https://github.com/danielnixon/eslint-plugin-total-functions/actions/workflows/node.js.yml/badge.svg)](https://github.com/danielnixon/eslint-plugin-total-functions/actions/workflows/node.js.yml)
[![Type Coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![Test Coverage](https://codecov.io/gh/danielnixon/eslint-plugin-total-functions/branch/master/graph/badge.svg)](https://codecov.io/gh/danielnixon/eslint-plugin-total-functions)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fdanielnixon%2Feslint-plugin-total-functions%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/danielnixon/eslint-plugin-total-functions/master)
[![Known Vulnerabilities](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/danielnixon/eslint-plugin-total-functions?targetFile=package.json)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/b228d6e8823946978bc94836211ee21b)](https://www.codacy.com/gh/danielnixon/eslint-plugin-total-functions/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=danielnixon/eslint-plugin-total-functions&amp;utm_campaign=Badge_Grade)
[![npm](https://img.shields.io/npm/v/eslint-plugin-total-functions.svg)](https://www.npmjs.com/package/eslint-plugin-total-functions)

An ESLint plugin to enforce the use of total functions (and prevent the use of [partial functions](https://wiki.haskell.org/Partial_functions)) in TypeScript. If you like your types to tell the truth, this is the ESLint plugin for you.

## Version Matrix

| TypeScript       | ESLint  | eslint-plugin-total-functions | Suppported? |
| :--------------: | :-----: | :---------------------------: | :---------: |
|  4.9.5           | 8.35.0  | 6.2.0                         |             |
|  4.7.3           | 8.17.0  | 6.0.0                         | No          |
|  4.5.4           | 8.5.0   | 5.0.0                         | No          |
|  4.4.2           | 7.32.0  | 4.10.1                        | No          |
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
|  no-unsafe-enum-assignment              | ✅           | ✅    |        |
|  no-enums                               | ✅           | ✅    |        |
|  no-partial-url-constructor             | ✅           | ✅    |        |
|  no-partial-division                    | ✅           | ✅    |        |
|  no-partial-string-normalize            | ✅           | ✅    |        |
|  no-premature-fp-ts-effects             | ✅           | ✅    |        |
|  no-partial-array-reduce                | ✅           | ✅    |        |
|  no-hidden-type-assertions              |              | ✅    |        |

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

### total-functions/no-enums

Enums have a number of issues, including unsoundness issues (which are especially relevant here). This rule bans the declaration of enums entirely. Use an alternative such as a union of strings instead.

### total-functions/no-unsafe-enum-assignment

If you do use an enum (or are forced to by a library), this rule flags unsafe assignment that the TypeScript compiler permits. For example:

```typescript
  enum ZeroOrOne {
    Zero = 0,
    One = 1,
  }

  // This compiles but is flagged by no-unsafe-enum-assignment
  const zeroOrOne: ZeroOrOne = 2;

  // This is not flagged by no-unsafe-enum-assignment
  const zeroOrOne: ZeroOrOne = ZeroOrOne.Zero;
```

### total-functions/no-partial-url-constructor

The URL constructor can throw (i.e. it is partial).

```typescript
// This compiles and foo appears to be a URL. It isn't.
const foo: URL = new URL(""); // Throws TypeError [ERR_INVALID_URL]: Invalid URL
```

Instead, you should use a wrapper that catches that error and returns `URL | undefined` or similar (perhaps using an `Option` type).

URL also happens to be mutable, which will be flagged by [prefer-immutable-types](https://github.com/eslint-functional/eslint-plugin-functional/blob/main/docs/rules/prefer-immutable-types.md). The [readonly-types](https://github.com/agiledigital/readonly-types) package provides a `readonlyURL` function that solves both of these issues.

### total-functions/no-partial-division

Division by zero is undefined. That makes the division operator partial.

In the case of `number`, it results in `Infinity` (IEEE 754...).

In the case of `bigint` it throws a `RangeError`.

The latter is much more indisputably partial than the former.

```
> 1 / 0
Infinity
> 1n / 0n
Uncaught RangeError: Division by zero
```

This rule flags division unless the denominator is provably non-zero. If you need division, you should wrap it in a wrapper that returns undefined when the denominator is zero. Alternatively, consider using branded types / refinements, such as https://github.com/gcanti/io-ts/blob/master/index.md#branded-types--refinements or https://gcanti.github.io/newtype-ts/modules/NonZero.ts.html

# See Also
* [TypeScript for Functional Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html)
* https://github.com/danielnixon/eslint-config-typed-fp
* https://github.com/agiledigital/readonly-types
* https://github.com/eslint-functional/eslint-plugin-functional
* https://github.com/RebeccaStevens/is-immutable-type
* https://github.com/gcanti/fp-ts
* https://github.com/plantain-00/type-coverage
* https://github.com/immutable-js/immutable-js
* https://github.com/shian15810/eslint-plugin-typescript-enum
