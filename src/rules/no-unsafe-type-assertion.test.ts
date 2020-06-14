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
    // as compatible type (object literal as type name)
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string }; const foo = {foo: 'foo'} as Foo;",
    },
    // as compatible type (object literal as type literal)
    {
      filename: "file.ts",
      code: "const foo = {foo: 'foo'} as { readonly foo: string };",
    },
    // as compatible type (value as type name)
    {
      filename: "file.ts",
      code:
        "const foo = {foo: 'foo'}; const bar = foo as { readonly foo: string };",
    },
    // as compatible type (value as type literal)
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string }; const foo = {foo: 'foo'}; const bar = foo as Foo;",
    },
    // as compatible type (extra prop)
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string }; const foo = {foo: 'foo', bar: 'bar'} as Foo;",
    },
    // as compatible type (optional prop not provided)
    {
      filename: "file.ts",
      code: "type Foo = { readonly foo?: string }; const foo = {} as Foo;",
    },
    // as compatible type (prop that is union including undefined not provided)
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string | undefined }; const foo = {} as Foo;",
    },
    // as compatible type (prop that is undefined not provided)
    {
      filename: "file.ts",
      code: "type Foo = { readonly foo: undefined }; const foo = {} as Foo;",
    },
    // as exact same type
    {
      filename: "file.ts",
      code: "const foo = 'foo' as 'foo';",
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
    // as incompatible type (source prop is present but its value is undefined)
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string }; type Bar = { readonly foo: string | undefined }; const bar: Bar = { foo: undefined }; const foobar = bar as Foo;",
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
  ],
});