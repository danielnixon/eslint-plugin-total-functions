import rule from "./no-unsafe-optional-property-assignment";
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
ruleTester.run("no-unsafe-optional-property-assignment", rule, {
  valid: [
    {
      filename: "file.ts",
      code: `
        type Foo = { readonly foo: string };
        type Bar = { readonly foo: string; readonly bar: (() => unknown) | undefined };
        const thing = { foo: "foo", bar: "bar" };
        const foo: Foo = thing;
        const bar: Bar = { ...foo, bar: undefined };
      `,
    },
  ],
  invalid: [
    {
      filename: "file.ts",
      code: `
        type Foo = { readonly foo: string };
        type Bar = { readonly foo: string; readonly bar?: () => unknown };
        const thing = { foo: "foo", bar: "bar" };
        const foo: Foo = thing;
        const bar: Bar = foo;
      `,
      errors: [
        {
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        type Foo = { readonly foo: string };
        type Bar = Foo & { readonly bar?: () => unknown };
        const thing = { foo: "foo", bar: "bar" };
        const foo: Foo = thing;
        const bar: Bar = foo;
      `,
      errors: [
        {
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
  ],
});
