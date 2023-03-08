import rule from "./no-partial-url-constructor";
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
ruleTester.run("no-partial-url-constructor", rule, {
  valid: [
    {
      filename: "file.ts",
      code: `
        new Set()
      `,
    },
  ],
  invalid: [
    {
      filename: "file.ts",
      code: `
        new URL("foo")
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.NewExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        new URL()
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.NewExpression,
        },
      ],
    },
  ],
} as const);
