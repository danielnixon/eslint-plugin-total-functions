import rule from "./no-array-subscript";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils/dist/ts-estree";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
ruleTester.run("no-array-subscript", rule, {
  valid: ["const obj = { 'a': 'a' }; const foo = obj.a;"],
  invalid: [
    {
      code: "const arr = [0, 1, 2]; const foo = arr[0];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
    {
      code: "const obj = { 'a': 'a' }; const foo = obj['a'];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.MemberExpression,
        },
      ],
    },
  ],
});
