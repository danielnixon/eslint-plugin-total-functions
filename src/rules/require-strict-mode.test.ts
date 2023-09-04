/* eslint-disable sonarjs/no-duplicate-string */
import rule from "./require-strict-mode";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

// eslint-disable-next-line functional/prefer-immutable-types
const ruleTesterForTSConfig = (config: string): ESLintUtils.RuleTester =>
  new ESLintUtils.RuleTester({
    parserOptions: {
      sourceType: "module",
      project: config,
      // EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
    },
    parser: "@typescript-eslint/parser",
  });

// eslint-disable-next-line functional/prefer-immutable-types
const strictRuleTester = ruleTesterForTSConfig("./tsconfig.tests.json");

// eslint-disable-next-line functional/no-expression-statements
strictRuleTester.run("require-strict-mode", rule, {
  valid: [
    {
      filename: "file.ts",
      code: "// strictRuleTester",
    },
  ],
  invalid: [],
} as const);

// eslint-disable-next-line functional/prefer-immutable-types
const nonStrictRuleTester = ruleTesterForTSConfig(
  "./tsconfig.tests.non-strict.json",
);

// eslint-disable-next-line functional/no-expression-statements
nonStrictRuleTester.run("require-strict-mode", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: "// nonStrictRuleTester",
      errors: [
        {
          messageId: "strict",
          type: AST_NODE_TYPES.Program,
        },
      ],
    },
  ],
} as const);

// eslint-disable-next-line functional/prefer-immutable-types
const nonNoUncheckedIndexedAccessRuleTester = ruleTesterForTSConfig(
  "./tsconfig.tests.non-noUncheckedIndexedAccess.json",
);

// eslint-disable-next-line functional/no-expression-statements
nonNoUncheckedIndexedAccessRuleTester.run("require-strict-mode", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: "// nonNoUncheckedIndexedAccessRuleTester",
      errors: [
        {
          messageId: "noUncheckedIndexedAccess",
          type: AST_NODE_TYPES.Program,
        },
      ],
    },
  ],
} as const);

// eslint-disable-next-line functional/prefer-immutable-types
const strictFunctionTypesRuleTester = ruleTesterForTSConfig(
  "./tsconfig.tests.non-strictFunctionTypes.json",
);

// eslint-disable-next-line functional/no-expression-statements
strictFunctionTypesRuleTester.run("require-strict-mode", rule, {
  valid: [],
  invalid: [
    {
      filename: "file.ts",
      code: "// strictFunctionTypesRuleTester",
      errors: [
        {
          messageId: "strictFunctionTypes",
          type: AST_NODE_TYPES.Program,
        },
      ],
    },
  ],
} as const);
