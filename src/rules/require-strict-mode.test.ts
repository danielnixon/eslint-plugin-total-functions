import rule from "./require-strict-mode";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";

const ruleTesterForTSConfig = (config: string): RuleTester =>
  new RuleTester({
    parserOptions: {
      sourceType: "module",
      project: config,
      // EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
    },
    parser: require.resolve("@typescript-eslint/parser"),
  });

const strictRuleTester = ruleTesterForTSConfig("./tsconfig.tests.json");

// eslint-disable-next-line functional/no-expression-statement
strictRuleTester.run("require-strict-mode", rule, {
  valid: [
    {
      filename: "file.ts",
      code: "// strictRuleTester",
    },
  ],
  invalid: [],
} as const);

// TODO re-enable
// const nonStrictRuleTester = ruleTesterForTSConfig(
//   "./tsconfig.tests.non-strict.json"
// );

// // eslint-disable-next-line functional/no-expression-statement
// nonStrictRuleTester.run("require-strict-mode", rule, {
//   valid: [],
//   invalid: [
//     {
//       filename: "file.ts",
//       code: "// nonStrictRuleTester",
//       errors: [
//         {
//           messageId: "strict",
//           type: AST_NODE_TYPES.Program,
//         },
//       ],
//     },
//   ],
// } as const);

// const nonNoUncheckedIndexedAccessRuleTester = ruleTesterForTSConfig(
//   "./tsconfig.tests.non-noUncheckedIndexedAccess.json"
// );

// // eslint-disable-next-line functional/no-expression-statement
// nonNoUncheckedIndexedAccessRuleTester.run("require-strict-mode", rule, {
//   valid: [],
//   invalid: [
//     {
//       filename: "file.ts",
//       code: "// nonNoUncheckedIndexedAccessRuleTester",
//       errors: [
//         {
//           messageId: "noUncheckedIndexedAccess",
//           type: AST_NODE_TYPES.Program,
//         },
//       ],
//     },
//   ],
// } as const);

// const strictFunctionTypesRuleTester = ruleTesterForTSConfig(
//   "./tsconfig.tests.non-strictFunctionTypes.json"
// );

// // eslint-disable-next-line functional/no-expression-statement
// strictFunctionTypesRuleTester.run("require-strict-mode", rule, {
//   valid: [],
//   invalid: [
//     {
//       filename: "file.ts",
//       code: "// strictFunctionTypesRuleTester",
//       errors: [
//         {
//           messageId: "strictFunctionTypes",
//           type: AST_NODE_TYPES.Program,
//         },
//       ],
//     },
//   ],
// } as const);
