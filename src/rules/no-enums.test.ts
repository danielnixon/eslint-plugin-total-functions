import rule from "./no-enums";
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
ruleTester.run("no-enums", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSEnumDeclaration,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero,
          One,
        }
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSEnumDeclaration,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        enum AOrB {
          A = "A",
          B = "B",
        }
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSEnumDeclaration,
        },
      ],
    },
  ],
} as const);
