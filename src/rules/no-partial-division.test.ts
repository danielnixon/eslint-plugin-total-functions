import rule from "./no-partial-division";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";

// eslint-disable-next-line functional/prefer-immutable-types
const ruleTester = new ESLintUtils.RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: "@typescript-eslint/parser",
});

// eslint-disable-next-line functional/no-expression-statements
ruleTester.run("no-partial-division", rule, {
  valid: [
    {
      filename: "file.ts",
      code: `
        1 / 1;
      `,
    },
    {
      filename: "file.ts",
      code: `
        1n / 1n;
      `,
    },
  ],
  invalid: [
    {
      filename: "file.ts",
      code: `;
        const result = 1 / 0;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.BinaryExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `;
        const result = 1n / 0n;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.BinaryExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        const foo: bigint = 1n;
        const bar: bigint = 0n;
        const result = foo / bar;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.BinaryExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        const foo: bigint = 1n;
        const bar: bigint = 1n;
        const result = foo / bar;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.BinaryExpression,
        },
      ],
    },
  ],
} as const);
