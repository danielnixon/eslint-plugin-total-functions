import rule from "./no-premature-fp-ts-effects";
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
ruleTester.run("no-premature-fp-ts-effects", rule, {
  valid: [
    {
      filename: "file.ts",
      code: `
        const myFunc = () => "hello";
        const result: string = myFunc();
      `,
    },
    {
      filename: "file.ts",
      code: `
        const myFunc = (s: string) => "hello " + s;
        const result: string = myFunc("asdf");
      `,
    },
    {
      filename: "file.ts",
      code: `
        export interface Lazy<A> {
          (): A
        }

        const lazy: Lazy<string> = () => "hello";

        const lazyResult: string = lazy();
      `,
    },
  ],
  invalid: [
    {
      filename: "file.ts",
      code: `
        export interface IO<A> {
          (): A
        }

        const io: IO<string> = () => "hello";

        const ioResult: string = io();
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        export interface Task<A> {
          (): Promise<A>
        }

        const task: Task<string> = () => Promise.resolve("hello");

        const taskResult: Promise<string> = task();
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        export interface IO<A> {
          (): A
        }
        const logErrors = (): IO<void> => () => undefined;
        const result = logErrors()();
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
