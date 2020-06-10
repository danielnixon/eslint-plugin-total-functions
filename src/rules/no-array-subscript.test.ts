import rule from "./no-array-subscript";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils/dist/ts-estree";

const ruleTester = new RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
ruleTester.run("no-array-subscript", rule, {
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
    // Tuple (within range).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, number]; const foo = arr[0];",
    },
    // Partial tuple (within range).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, ...number[]]; const foo = arr[0];",
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
    // Object subscript property access.
    {
      filename: "file.ts",
      code: "const obj = { 'a': 'a' }; const foo = obj['a'];",
    },
  ],
  invalid: [
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
    // Partial tuple (outside range)
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
    // Tuple (outside range)
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, number]; const foo = arr[42];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Object subscript property access (invalid property name).
    {
      filename: "file.ts",
      code: "const obj = { 'a': 'a' }; const foo = obj['b'];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Record
    {
      filename: "file.ts",
      code:
        "const record = { foo: 'foo' } as Record<string, string>; const bar = record['foo'];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Result immediately returned as type that includes undefined.
    // TODO: ideally this could be allowed because the partiality isn't observable.
    {
      filename: "file.ts",
      code:
        "const last: <A>(array: ReadonlyArray<A>) => A | undefined = (a) => a[a.length - 1];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    // Result immediately assigned to type that includes undefined.
    // TODO: ideally this could be allowed because the partiality isn't observable.
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
});
