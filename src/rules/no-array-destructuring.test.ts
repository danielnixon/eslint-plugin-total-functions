import rule from "./no-array-destructuring";
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
ruleTester.run("no-array-destructuring", rule, {
  valid: [
    // Destructuring a regular array as an object.
    {
      filename: "file.ts",
      code: "const arr = [0, 1, 2] as number[]; const { length } = arr;",
    },
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
  ],
});
