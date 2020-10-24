import rule from "./no-unsafe-destructuring";
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
ruleTester.run("no-unsafe-destructuring", rule, {
  valid: [
    // Const array destructuring.
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2] as const; const [foo] = arr;",
    },
    // Tuple destructuring (within range).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, number]; const [foo] = arr;",
    },
    // Destructuring a partial tuple (within range).
    {
      filename: "file.ts",
      code:
        "const array = [0, 1, 2] as [number, ...number[]]; const [foo] = array;",
    },
    // Array destructuring when array type contains undefined.
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as Array<number | undefined>; const [foo] = arr;",
    },
    // Destructuring a regular array with type annotation that adds undefined.
    {
      filename: "file.ts",
      code:
        "const array = [0]; const [foo]: ReadonlyArray<number | undefined> = array;",
    },
    // Object destructuring (all fields exist).
    {
      filename: "file.ts",
      code: "const obj = { 'a': 'a' }; const { a } = obj;",
    },
    // Object destructuring (numeric property).
    {
      filename: "file.ts",
      code: `
        const obj = { 42: { a: "a" } };
        const {
          42: { a },
        } = obj;      
      `,
    },
    // Object destructuring (with rest element).
    {
      filename: "file.ts",
      code: "const obj = { 'a': 'a' }; const { a, ...rest } = obj;",
    },
    // Object destructuring (property name contains hyphen).
    // https://github.com/danielnixon/eslint-plugin-total-functions/issues/37
    {
      filename: "file.ts",
      code: `
        type Foo = {
          readonly "foo-bar": number;
        };
        const { "foo-bar": fooBar }: Foo = { "foo-bar": 42 };
      `,
    },
    // Object destructuring (nested).
    // https://github.com/danielnixon/eslint-plugin-total-functions/issues/37
    {
      filename: "file.ts",
      code: `
        type Foo = {
          readonly foo: {
            readonly bar: number;
          };
        };
        const {
          foo: { bar: bazQux },
        }: Foo = { foo: { bar: 42 } };
      `,
    },
  ],
  invalid: [
    // Destructuring a regular array, even if within range at runtime.
    {
      filename: "file.ts",
      code: "const array = [0, 1, 2] as number[]; const [foo] = array;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
        },
      ],
    },
    // Destructuring a regular array with type annotation that doesn't add undefined.
    {
      filename: "file.ts",
      code: "const array = [0]; const [foo]: ReadonlyArray<number> = array;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
        },
      ],
    },
    // Destructuring a regular array (outside range).
    {
      filename: "file.ts",
      code:
        "const array = [0, 1, 2] as number[]; const [foo, bar, baz, qux] = array;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
        },
      ],
    },
    // Tuple destructuring (outside range).
    {
      filename: "file.ts",
      code:
        "const arr = [0, 1, 2] as [number, number, number]; const [foo, bar, baz, qux] = arr;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
        },
      ],
    },
    // Destructuring a partial tuple (outside range).
    {
      filename: "file.ts",
      code:
        "const array = [0, 1, 2] as [number, ...number[]]; const [foo, bar, baz, qux] = array;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
        },
      ],
    },
    // Object destructuring (field doesn't exist).
    {
      filename: "file.ts",
      code: "const obj = { 'a': 'a' }; const { b } = obj;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ObjectPattern,
        },
      ],
    },
    // Object destructuring (record).
    {
      filename: "file.ts",
      code:
        "const obj: Record<string, string> = { a: 'a' }; const { a } = obj;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ObjectPattern,
        },
      ],
    },
    // string
    {
      filename: "file.ts",
      code: `
        const str = "a string";
        const [foo] = str;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
        },
      ],
    },
    // no number index type
    {
      filename: "file.ts",
      code: `
        const arr: any = [];
        const [foo] = arr;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
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
//       code: `
//         const arr: any = [];
//         const [foo] = arr;
//         `,
//     },
//   ],
//   invalid: [],
// } as const);
