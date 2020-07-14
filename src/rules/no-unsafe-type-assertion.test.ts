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
      code: "const foo = { a: [] } as const;",
    },
    // as unknown
    {
      filename: "file.ts",
      code: "const foo = { a: [] } as unknown;",
    },
    // as any (dumb but will be caught by other rules)
    {
      filename: "file.ts",
      code: "const foo = { a: [] } as any;",
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
    // as exact same type (object)
    {
      filename: "file.ts",
      code: "const foo = {foo: 'a'} as {foo: 'a'};",
    },
    // as exact same type (string)
    {
      filename: "file.ts",
      code: "const foo = 'a' as 'a';",
    },
    // widening string to union
    {
      filename: "file.ts",
      code: "const foo = 'foo' as 'foo' | 'bar';",
    },
    // widening string to string
    {
      filename: "file.ts",
      code: "const foo = 'foo' as string;",
    },
    // widening number to number
    {
      filename: "file.ts",
      code: "const foo = 42 as number;",
    },
    // widening object to object | undefined
    {
      filename: "file.ts",
      code: `
        type Foo = object;
        const foo: Foo = {};
        const bar = foo as Foo | undefined;
      `,
    },
    // recursive type (linting must terminate)
    {
      filename: "file.ts",
      code: `
        type Foo = { readonly a: Foo } | undefined;
        type Bar = { readonly a: Bar } | undefined;
        const foo: Foo = { a: undefined };
        const bar = foo as Bar;
      `,
    },
    // deprecated type assertion style
    {
      filename: "file.ts",
      code: "const foo = <any>'foo';",
    },
  ],
  invalid: [
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
    // as incompatible type (value as type literal)
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
    // as incompatible type (value as type name)
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
    // as incompatible type (multiple properties, some valid + some invalid)
    {
      filename: "file.ts",
      code:
        "type Foo = { readonly foo: string, readonly bar: string }; const foo = { foo: '' }; const bar = foo as Foo;",
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
    // as incompatible type (union)
    {
      filename: "file.ts",
      code: `
        type Foo = { readonly foo: string };
        type Bar = { readonly foo: string | undefined };
        const bar: Bar = { foo: undefined };
        const foobar = bar as Foo | number;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // as incompatible type (nested)
    {
      filename: "file.ts",
      code: `
        type Foo = { readonly foo: { readonly a: string } };
        type Bar = { readonly foo: { readonly a: string | undefined } };
        const bar: Bar = { foo: { a: undefined } };
        const foobar = bar as Foo;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
  ],
});
