import rule from "./no-unsafe-type-assertion";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils/dist/ts-estree";

const ruleTester = new RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
ruleTester.run("no-unsafe-type-assertion", rule, {
  valid: [
    // as const
    {
      filename: "file.ts",
      code: "const foo = 'foo' as const;",
    },
    // as unknown
    {
      filename: "file.ts",
      code: "const foo = 'foo' as unknown;",
    },
    // as any (dumb but will be caught by other rules)
    {
      filename: "file.ts",
      code: "const foo = 'foo' as any;",
    },
  ],
  invalid: [
    // deprecated type assertion style
    {
      filename: "file.ts",
      code: "const foo = <any>'foo';",
      errors: [
        {
          messageId: "errorStringPreferAs",
          type: AST_NODE_TYPES.TSTypeAssertion,
        },
      ],
    },
    // as incompatible type (object literal as type name)
    {
      filename: "file.ts",
      code: "type Foo = { readonly foo: string }; const foo = {} as Foo;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as incompatible type (object literal as type literal)
    {
      filename: "file.ts",
      code: "const foo = {} as { readonly foo: string };",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as incompatible type (value as type name)
    {
      filename: "file.ts",
      code: "const foo = {}; const bar = foo as { readonly foo: string };",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as incompatible type (value as type literal)
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string }; const foo = {}; const bar = foo as Foo;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as compatible type (object literal as type name)
    // TODO this should be valid.
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string }; const foo = {foo: 'foo'} as Foo;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as compatible type (object literal as type literal)
    // TODO this should be valid.
    {
      filename: "file.ts",
      code: "const foo = {foo: 'foo'} as { readonly foo: string };",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as compatible type (value as type name)
    // TODO this should be valid.
    {
      filename: "file.ts",
      code:
        "const foo = {foo: 'foo'}; const bar = foo as { readonly foo: string };",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as compatible type (value as type literal)
    // TODO this should be valid.
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string }; const foo = {foo: 'foo'}; const bar = foo as Foo;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
  ],
});
