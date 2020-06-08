import rule from "./no-array-destructuring";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils/dist/ts-estree";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
ruleTester.run("no-array-destructuring", rule, {
  valid: ["const { a } = { a: 'a' };"],
  invalid: [
    {
      code: "const [a, b, c] = [0, 1, 2];",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrayPattern,
        },
      ],
    },
  ],
});
