import rule from "./no-partial-array-reduce";
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
ruleTester.run("no-partial-array-reduce", rule, {
  valid: [
    // non-empty array literal, reduce
    {
      filename: "file.ts",
      code: `
        ["a"].reduce(() => "a");
      `,
    },
    // non-empty array literal, reduceRight
    {
      filename: "file.ts",
      code: `
        ["a"].reduceRight(() => "a");
      `,
    },
    // empty array literal, initial value provided
    {
      filename: "file.ts",
      code: `
        [].reduce(() => "b", "a");
      `,
    },
    // non-empty tuple
    {
      filename: "file.ts",
      code: `
        const arr = ["a"] as const;
        arr.reduce(() => "b");
      `,
    },
    // non-empty tuple with rest
    {
      filename: "file.ts",
      code: `
        const arr: [string, ...string[]] = ["a"];
        arr.reduce(() => "b");
      `,
    },
    // initial value provided
    {
      filename: "file.ts",
      code: `
        const arr = ["string"];
        arr.reduce(() => "b", "a");
      `,
    },
    // initial value provided, readonly array
    {
      filename: "file.ts",
      code: `
        const arr: readonly string[] = ["string"];
        arr.reduce(() => "b", "a");
      `,
    },
    // non-array type
    {
      filename: "file.ts",
      code: `
        type Foo = {
          reduce: (func: () => void) => void;
        };
        declare const foo: Foo;
        foo.reduce(() => "a");
      `,
    },
    // method other than reduce
    {
      filename: "file.ts",
      code: `
        [].filter(() => true);
      `,
    },
    // union of array types, initial value provided
    {
      filename: "file.ts",
      code: `
        const arr: readonly string[] | readonly number[] = ["string"];
        arr.reduce(() => "b", "a");
      `,
    },
    // literal with first element undefined (doesn't throw)
    {
      filename: "file.ts",
      code: `
        [undefined].reduce(() => "a");
      `,
    },
    // computed form, literal
    {
      filename: "file.ts",
      code: `
        ["a"]["reduce"](() => "a");
      `,
    },
    // computed form, value
    {
      filename: "file.ts",
      code: `
        const n = "reduce";
        ["a"][n](() => "a");
      `,
    },
    // computed form, union
    {
      filename: "file.ts",
      code: `
        let n: "reduce" | "reduceRight" = "reduce";
        if (Date.now > 0) {
          n = "reduceRight";
        }
        ["a"][n](() => "a");
      `,
    },
    // other function named reduce
    {
      filename: "file.ts",
      code: `
        const reduce = () => "a";
        reduce();
      `,
    },
  ],
  invalid: [
    // array of unknown length, reduce
    {
      filename: "file.ts",
      code: `
        const arr: readonly string[] = ["string"];
        arr.reduce(() => "b");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // array of unknown length, reduceRight
    {
      filename: "file.ts",
      code: `
        const arr: readonly string[] = ["string"];
        arr.reduceRight(() => "b");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // empty literal
    {
      filename: "file.ts",
      code: `
        [].reduce(() => "b");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // empty tuple
    {
      filename: "file.ts",
      code: `
        const arr = [] as const;
        arr.reduce(() => "b");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // union of array types, initial value not provided
    {
      filename: "file.ts",
      code: `
        const arr: readonly string[] | readonly number[] = ["string"];
        arr.reduce(() => "b");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // literal with spread
    {
      filename: "file.ts",
      code: `
        [...[]].reduce(() => "a");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // computed form, literal
    {
      filename: "file.ts",
      code: `
        const arr: string[] = [];
        arr["reduce"](() => "a");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // computed form, value
    {
      filename: "file.ts",
      code: `
        const arr: string[] = [];
        const n = "reduce";
        arr[n](() => "a");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // computed form, union
    {
      filename: "file.ts",
      code: `
        const arr: string[] = [];
        let n: "reduce" | "reduceRight" = "reduce";
        if (Date.now > 0) {
          n = "reduceRight";
        }
        arr[n](() => "a");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
  ],
} as const);
