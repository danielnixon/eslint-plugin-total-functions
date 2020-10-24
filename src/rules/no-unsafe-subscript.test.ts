import rule from "./no-unsafe-subscript";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils/dist/ts-estree";

const ruleTester = new RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.non-noUncheckedIndexedAccess.json",
  },
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
ruleTester.run("no-unsafe-subscript", rule, {
  valid: [
    // Regular array property access.
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2] as number[]; const foo = arr.length;",
    },
    // Const array property access.
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2] as const; const foo = arr[0];",
    },
    // Const array property access with non-literal (but const) key.
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as const; const key = 0 as const; const foo = arr[key];",
    },
    // Tuple (within range).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, number]; const foo = arr[0];",
    },
    // Tuple (last element within range).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, number]; const foo = arr[2];",
    },
    // Partial tuple (within range of tuple portion).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, ...number[]]; const foo = arr[0];",
    },
    // Tuple (outside range)
    // Not flagged by this rule because TypeScript itself will complain about it.
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, number]; const foo = arr[3];",
    },
    // Array subscript access where array generic type is union including undefined.
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as Array<number | undefined>; const foo = arr[0];",
    },
    // Array subscript access where array generic type is undefined.
    {
      filename: "file.ts",
      code: "const arr = [] as Array<undefined>; const foo = arr[0];",
    },
    // Object subscript property access (string).
    {
      filename: "file.ts",
      code: "const obj = { 'a': 'a' }; const foo = obj['a'];",
    },
    // Object subscript property access (number).
    {
      filename: "file.ts",
      code: "const obj = { 100: 'a' }; const foo = obj[100];",
    },
    // Object subscript property access (symbol).
    {
      filename: "file.ts",
      code: "const s = Symbol(); const obj = { [s]: 'a' }; const foo = obj[s];",
    },
    // Array assignment (unwise, but not a partiality issue).
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2]; arr[0] = 42;",
    },
    // Type assertion to add undefined.
    {
      filename: "file.ts",
      code: "const arr = [0]; const foo = arr[0] as number | undefined;",
    },
    // Object subscript property access (invalid string property name).
    // TypeScript catches this and our rule only cares about objects with index signatures.
    {
      filename: "file.ts",
      code: "const obj = { 'a': 'a' }; const foo = obj['b'];",
    },
    // Object subscript property access (invalid number property name).
    // TypeScript catches this and our rule only cares about objects with index signatures.
    {
      filename: "file.ts",
      code: "const obj = { 100: 'a' }; const foo = obj[200];",
    },

    // Result returned from arrow function expression (the compact form) whose return type includes undefined.
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "const last: <A>(array: ReadonlyArray<A>) => A | undefined = (a) => a[a.length - 1];",
    },
    // Result returned from arrow function whose return type includes undefined.
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "const last: <A>(array: ReadonlyArray<A>) => A | undefined = (a) => { console.log('a'); return a[a.length - 1]; }",
    },
    // Result returned from function whose return type includes undefined.
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "function last<A>(array: ReadonlyArray<A>): A | undefined { console.log('a'); return array[array.length - 1]; }",
    },
    // Result returned from function (alternate syntax) whose return type includes undefined.
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "const last = function <A>(array: ReadonlyArray<A>): A | undefined { console.log('a'); return array[array.length - 1]; }",
    },
    // Object expression where result of array access is assigned to optional property (type name).
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo?: number }; const arr = [0]; const foo: Foo = { foo: arr[0] };",
    },
    // Object expression where result of array access is assigned to optional property (type literal).
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "const arr = [0]; const foo: { readonly foo?: number } = { foo: arr[0] };",
    },
    // Object expression where result of array access is assigned to property that includes undefined (type name).
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: number | undefined }; const arr = [0]; const foo: Foo = { foo: arr[0] };",
    },
    // Object expression where result of array access is assigned to property that includes undefined (type literal).
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "const arr = [0]; const foo: { readonly foo: number | undefined } = { foo: arr[0] };",
    },
    // Object expression with type assertion that includes undefined for the property being assigned to by the array access.
    // Allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "const arr = [0]; const foo = { foo: arr[0] } as { readonly foo: number | undefined };",
    },
    // Record (calculated property access) includes undefined in record type
    {
      filename: "file.ts",
      code: `
        const record: Record<string, string | undefined> = { foo: 'foo' };
        const bar = record['bar'];
      `,
    },
    // Record (regular property access) includes undefined in record type
    {
      filename: "file.ts",
      code: `
        const record: Record<string, string | undefined> = { foo: 'foo' };
        const bar = record.bar;
      `,
    },
  ],
  invalid: [
    // Partial tuple property access with non-literal (but const) key (within range of tuple portion).
    {
      filename: "file.ts",
      code:
        "const arr: readonly [0, 1, 2, ...(readonly number[])] = [0, 1, 2]; const key = 1; const foo = arr[key];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Array subscript access.
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2] as number[]; const foo = arr[0];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Array subscript access with type annotation (single type).
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2] as number[]; const foo: number = arr[0];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Array subscript access with type annotation (union).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as number[]; const foo: number | string = arr[0];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Partial tuple (first element outside range)
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, ...number[]]; const foo = arr[2];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Partial tuple (well outside range)
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, ...number[]]; const foo = arr[42];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Record (calculated property access)
    {
      filename: "file.ts",
      code: `
        const record: Record<string, string> = { foo: 'foo' };
        const bar = record['bar'];
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Record (regular property access)
    {
      filename: "file.ts",
      code: `
        const record: Record<string, string> = { foo: 'foo' };
        const bar = record.bar;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Result immediately assigned to type that does not include undefined.
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2]; let foo: number = 1; foo = arr[0];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Array access within an arrow function but not the return value;
    {
      filename: "file.ts",
      code:
        "const last: <A>(array: ReadonlyArray<A>) => A | undefined = (a) => { a[a.length - 1]; return undefined; }",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Array access within a function but not the return value;
    {
      filename: "file.ts",
      code:
        "function last<A>(array: ReadonlyArray<A>): A | undefined { array[array.length - 1]; return undefined; }",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Partial tuple property access with non-literal (but const) key (outside range of tuple portion).
    {
      filename: "file.ts",
      code:
        "const arr: readonly [0, 1, 2, ...(readonly number[])] = [0, 1, 2]; const key = 42; const foo = arr[key];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Type assertion but doesn't add undefined.
    {
      filename: "file.ts",
      code: "const arr = [0]; const foo = arr[0] as number;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // optional member array access
    {
      filename: "file.ts",
      code: `
        const arr: ReadonlyArray<number> = [];
        const foo = arr?.[0];
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // string
    {
      filename: "file.ts",
      code: `
        const str = "a string";
        const bar = str[42];
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Result immediately assigned to type that includes undefined, so we can ignore the partiality.
    // This is NOT safe due to definite assignment analysis 🤦
    // see https://github.com/danielnixon/eslint-plugin-total-functions/issues/68 for details
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2]; let foo: number | undefined = undefined; foo = arr[0];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Result used to initialise a value that includes undefined.
    // This is NOT safe due to definite assignment analysis 🤦
    // see https://github.com/danielnixon/eslint-plugin-total-functions/issues/68 for details
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2]; const foo: number | undefined = arr[0];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
  ],
} as const);

// TODO re-enable
// const noUncheckedIndexedAccessRuleTester = new RuleTester({
//   parserOptions: {
//     sourceType: "module",
//     project: "./tsconfig.tests.json",
//   },
//   parser: require.resolve("@typescript-eslint/parser"),
// });

// // eslint-disable-next-line functional/no-expression-statement
// noUncheckedIndexedAccessRuleTester.run("no-unsafe-subscript", rule, {
//   valid: [
//     {
//       filename: "file.ts",
//       code: "const arr = [0, 1, 2] as number[]; const foo = arr[0];",
//     },
//   ],
//   invalid: [],
// } as const);
