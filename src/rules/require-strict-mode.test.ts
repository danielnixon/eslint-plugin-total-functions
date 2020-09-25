// TODO https://github.com/typescript-eslint/typescript-eslint/pull/2601
/* eslint-disable total-functions/no-unsafe-mutable-readonly-assignment */
import rule from "./require-strict-mode";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils";

const ruleTesterForTSConfig = (config: string): RuleTester =>
  new RuleTester({
    parserOptions: {
      sourceType: "module",
      project: config,
    },
    parser: require.resolve("@typescript-eslint/parser"),
  });

const strictRuleTester = ruleTesterForTSConfig("./tsconfig.tests.json");

// eslint-disable-next-line functional/no-expression-statement, sonarjs/no-duplicate-string
strictRuleTester.run("require-strict-mode", rule, {
  valid: [
    {
      filename: "file.ts",
      code: "",
    },
  ],
  invalid: [],
});

const nonStrictRuleTester = ruleTesterForTSConfig(
  "./tsconfig.tests.non-strict.json"
);

// eslint-disable-next-line functional/no-expression-statement
nonStrictRuleTester.run("require-strict-mode", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: "",
      errors: [
        {
          messageId: "errorStringStrictMode",
          type: AST_NODE_TYPES.Program,
        },
      ],
    },
  ],
});

const nonNoUncheckedIndexedAccessRuleTester = ruleTesterForTSConfig(
  "./tsconfig.tests.non-noUncheckedIndexedAccess.json"
);

// eslint-disable-next-line functional/no-expression-statement
nonNoUncheckedIndexedAccessRuleTester.run("require-strict-mode", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: "",
      errors: [
        {
          messageId: "errorStringNoUncheckedIndexedAccess",
          type: AST_NODE_TYPES.Program,
        },
      ],
    },
  ],
});
