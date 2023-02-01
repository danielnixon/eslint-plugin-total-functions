import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import { Immutability } from "is-immutable-type";
import rule from "./no-decreasing-immutability";

// eslint-disable-next-line functional/prefer-immutable-types
const ruleTester = new ESLintUtils.RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: "@typescript-eslint/parser",
});

// eslint-disable-next-line functional/no-expression-statements
ruleTester.run("no-decreasing-immutability", rule, {
  valid: [
    {
      filename: "file.ts",
      code: `
        const foo: Array<string> = [""];
        let bar: Readonly<string> = [""];        
        bar = foo;
      `,
    },
  ],
  invalid: [
    {
      filename: "file.ts",
      code: `
      const foo: ReadonlyArray<string> = [""];
      let bar: Array<string> = [""];        
      bar = foo;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.AssignmentExpression,
          line: 4,
          column: 7,
          endColumn: 16,
          data: {
            sourceImmutability: Immutability[Immutability.ReadonlyDeep],
            destinationImmutability: Immutability[Immutability.Mutable],
          },
        },
      ],
    },
  ],
} as const);
