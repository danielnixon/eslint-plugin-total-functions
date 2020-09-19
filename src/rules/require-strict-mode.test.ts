import rule from "./require-strict-mode";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils";

const strictRuleTester = new RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
strictRuleTester.run("require-strict-mode", rule, {
  valid: [
    {
      filename: "file.ts",
      code: "const foo = 'foo';",
    },
  ],
  invalid: [],
});

const nonStrictRuleTester = new RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.non-strict.json",
  },
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
nonStrictRuleTester.run("require-strict-mode", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: "const foo = 'foo';",
      errors: [
        {
          messageId: "errorStringStrictMode",
          type: AST_NODE_TYPES.Program,
        },
      ],
    },
  ],
});

const nonNoUncheckedIndexedAccessRuleTester = new RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.non-noUncheckedIndexedAccess.json",
  },
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
nonNoUncheckedIndexedAccessRuleTester.run("require-strict-mode", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: "const foo = 'foo';",
      errors: [
        {
          messageId: "errorStringNoUncheckedIndexedAccess",
          type: AST_NODE_TYPES.Program,
        },
      ],
    },
  ],
});
