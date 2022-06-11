import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils";
import { ESLintUtils } from "@typescript-eslint/experimental-utils";
import rule from "./no-unsafe-mutable-readonly-assignment";

const ruleTester = new ESLintUtils.RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: "@typescript-eslint/parser",
});

// eslint-disable-next-line functional/no-expression-statement
ruleTester.run("no-unsafe-mutable-readonly-assignment", rule, {
  valid: [
    /**
     * Call expressions
     */
    // zero parameters
    {
      filename: "file.ts",
      code: `
        const foo = () => {
          return undefined;
        };
        foo();
      `,
    },
    // zero parameters with extra argument (TypeScript will catch this so we don't flag it)
    {
      filename: "file.ts",
      code: `
        const foo = () => {
          return undefined;
        };
        foo("");
      `,
    },
    // non-object parameter
    {
      filename: "file.ts",
      code: `
        const foo = (a: string) => {
          return undefined;
        };
        foo("a");
      `,
    },
    // missing arguments (TypeScript will catch this so we don't flag it)
    {
      filename: "file.ts",
      code: `
        const foo = (a: string) => {
          return undefined;
        };
        foo();
      `,
    },
    // readonly -> readonly (nested object; type doesn't change)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: { readonly b: string } };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        const readonlyA = { a: { b: "" } } as const;
        func(readonlyA);
      `,
    },
    // mutable -> mutable (type doesn't change)
    {
      filename: "file.ts",
      code: `
        type MutableA = {a: string};
        const foo = (mut: MutableA) => {
          mut.a = "whoops";
        };
        const mut: MutableA = { a: "" };
        foo(mut);
      `,
    },
    // object literal -> mutable (no reference to object retained)
    {
      filename: "file.ts",
      code: `
        type MutableA = {a: string};
        const foo = (mut: MutableA) => {
          mut.a = "whoops";
        };
        foo({ a: "" });
      `,
    },
    // object literal -> mutable (mutable reference to property retained)
    {
      filename: "file.ts",
      code: `
        type MutableB = { b: string };
        type MutableA = { readonly a: MutableB };
        const func = (param: MutableA): void => {
          return undefined;
        };
        const b: MutableB = { b: "" };
        func({ a: b } as const);
      `,
    },
    // object literal -> readonly (readonly reference to property retained)
    {
      filename: "file.ts",
      code: `
        type ReadonlyB = { readonly b: string };
        type ReadonlyA = { readonly a: ReadonlyB };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        const b: ReadonlyB = { b: "" } as const;
        func({ a: b } as const);
      `,
    },
    // object literal -> readonly (no reference to object or its property retained)
    {
      filename: "file.ts",
      code: `
        type ReadonlyB = { readonly b: string };
        type ReadonlyA = { readonly a: ReadonlyB };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        func({ a: { b: "" } } as const);
      `,
    },
    // mutable (union) -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = {a: string};
        const foo = (mut: MutableA) => {
          mut.a = "whoops";
        };
        const mut: MutableA | number = { a: "" };
        foo(mut);
      `,
    },
    // mutable -> mutable (union)
    {
      filename: "file.ts",
      code: `
        type MutableA = {a: string};
        const foo = (mut: MutableA | number): void => {
          return;
        };
        const mut: MutableA = { a: "" };
        foo(mut);
      `,
    },
    // multiple type signatures (readonly -> readonly)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };

        export function func(a: number): number;
        export function func(a: ReadonlyA): ReadonlyA;
        export function func(a: any): any {
          return a;
        }

        const readonlyA: ReadonlyA = { a: "" } as const;
        func(readonlyA);
      `,
    },
    // multiple type signatures (no matching signature)
    // we don't bother flagging this because TypeScript itself will catch it
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };

        export function func(a: number): number;
        export function func(a: string): string;
        export function func(a: any): any {
          return a;
        }

        const readonlyA: ReadonlyA = { a: "" } as const;
        func(readonlyA);
      `,
    },
    // readonly array concat.
    {
      filename: "file.ts",
      code: `
        const arr: ReadonlyArray<never> = [] as const;
        const foo = arr.concat(arr, arr);
      `,
    },
    // TODO: https://github.com/danielnixon/eslint-plugin-total-functions/issues/132
    // // mutable array concat.
    // {
    //   filename: "file.ts",
    //   code: `
    //     const arr: Array<never> = [];
    //     const foo = arr.concat(arr, arr);
    //   `,
    // },
    // // Mixed mutable and readonly array concat.
    // {
    //   filename: "file.ts",
    //   code: `
    //     const ro: ReadonlyArray<never> = [] as const;
    //     const mut: Array<never> = [];
    //     const foo = ro.concat(ro, mut);
    //   `,
    // },
    // mixed (union) -> mixed (union)
    // The readonlys align and mutables align, so no surprising mutation can arise.
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyB = { readonly b: string };
        const func = (foo: MutableA | ReadonlyB): void => {
          return;
        };
        const foo: MutableA | ReadonlyB = Date.now() > 0 ? { a: "" } : { b: "" } as const;
        func(foo);
      `,
    },
    // readonly array of readonly object -> readonly array of readonly object
    {
      filename: "file.ts",
      code: `
        type Obj = { readonly foo: string };
        const foo = (a: ReadonlyArray<Obj>): number => a.length;
        const arr: ReadonlyArray<Obj> = [] as const;
        foo(arr);
      `,
    },
    /**
     * Assignment expressions
     */
    // TODO
    /**
     * Arrow functions
     */
    // Arrow function (compact form) (readonly -> readonly)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" } as const;
        const func = (): ReadonlyA => ro;
      `,
    },
    // Arrow function (compact form) (object literal -> readonly)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const func = (): ReadonlyA => ({ a: "" } as const);
      `,
    },
    // Arrow function (compact form) (object literal -> mutable)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        const func = (): MutableA => { a: "" };
      `,
    },
    // Arrow function (compact form) (mutable -> mutable)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        const ro: MutableA = { a: "" };
        const func = (): MutableA => ro;
      `,
    },
    /**
     * type assertions
     */
    // readonly -> readonly
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" } as const;
        const mut = ro as ReadonlyA;
      `,
    },
    // mutable -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        const ro: MutableA = { a: "" };
        const mut = ro as MutableA;
      `,
    },
    // readonly -> readonly
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" } as const;
        const mut = <ReadonlyA>ro;
      `,
    },
    // mutable -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        const ro: MutableA = { a: "" };
        const mut = <MutableA>ro;
      `,
    },
    // as const
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" } as const;
      `,
    },
    // <const>
    {
      filename: "file.ts",
      code: `
      type ReadonlyA = { readonly a: string };
      const ro: ReadonlyA = <const>{ a: "" };
      `,
    },
    // as unknown
    {
      filename: "file.ts",
      code: `
        const foo = [{ key: -1, label: "", value: "" }] as unknown;
      `,
    },
    /**
     * Return statement
     */
    // mutable -> mutable (function return)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        function foo(): MutableA {
          const ma: MutableA = { a: "" };
          return ma;
        }
      `,
    },
    // readonly -> readonly (function return)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        function foo(): ReadonlyA {
          const ma: ReadonlyA = { a: "" } as const;
          return ma;
        }
      `,
    },
    // mutable -> mutable (type changes)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type MutableB = { a: string | null };
        const foo = (mut: MutableB): void => {
          mut.a = null; // whoops
        };
        const mut: MutableA = { a: "" };
        foo(mut);
      `,
    },
    // tuple -> readonly array (nested objected property)
    {
      filename: "file.ts",
      code: `
        type Foo = {
          readonly foo: ReadonlyArray<{
            readonly a: string;
            readonly b: string;
          }>;
        };

        const f: Foo = {
          foo: [{
            a: "",
            b: "",
          }],
        } as const;
      `,
    },
    // mutable function return -> mutable function return (multiple call signatures).
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };

        interface MutableFunc {
          (b: number): MutableA;
          (b: string): MutableA;
        }

        const mf: MutableFunc = (b: number | string): MutableA => {
          return { a: "" };
        };

        const rf: MutableFunc = mf;
      `,
    },
    // readonly function return -> readonly function return (multiple call signatures).
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };

        interface ReadonlyFunc {
          (b: number): ReadonlyA;
          (b: string): ReadonlyA;
        }

        const mf: ReadonlyFunc = (b: number | string): ReadonlyA => {
          return { a: "" } as const;
        };

        const rf: ReadonlyFunc = mf;
      `,
    },
    // Return empty tuple from function that is declared to return some readonly array type.
    {
      filename: "file.ts",
      code: `
        type Foo = ReadonlyArray<{ readonly a: string }>;
        const foo = (): Foo => {
          return [] as const;
        };
      `,
    },
    // Return empty tuple from function that is declared to return empty tuple.
    {
      filename: "file.ts",
      code: `
        type Foo = readonly [];
        const foo = (): Foo => {
          return [] as const;
        };
      `,
    },
  ],
  invalid: [
    // initalization using mutable (literal) -> readonly
    // TODO this should ideally be considered valid without requiring an `as const`.
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const readonlyA: ReadonlyA = { a: "" };
      `,
      errors: [
        {
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // TODO `{ a: b } as const` is being flagged here. Is that correct?
    // // object literal -> readonly (mutable reference to property retained)
    // {
    //   filename: "file.ts",
    //   code: `
    //     type MutableB = { b: string };
    //     type ReadonlyA = { readonly a: { readonly b: string } };
    //     const func = (param: ReadonlyA): void => {
    //       return undefined;
    //     };
    //     const b: MutableB = { b: "" };
    //     func({ a: b } as const);
    //   `,
    //   errors: [
    //     {
    //       messageId: "errorStringCallExpression",
    //       type: AST_NODE_TYPES.Identifier,
    //     },
    //   ],
    // },
    /**
     * type assertions
     */
    // mutable -> readonly
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: MutableA = { a: "" };
        const mut = <ReadonlyA>ro;
      `,
      errors: [
        {
          messageId: "errorStringTSTypeAssertion",
          type: AST_NODE_TYPES.TSTypeAssertion,
        },
      ],
    },
    // mutable -> readonly
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: MutableA = { a: "" };
        const mut = ro as ReadonlyA;
      `,
      errors: [
        {
          messageId: "errorStringTSAsExpression",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // mutable -> readonly
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = Readonly<MutableA>;
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        const mutableA: MutableA = { a: "" };
        func(mutableA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // mutable -> readonly (function return)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        function foo(): ReadonlyA {
          const ma: MutableA = { a: "" };
          return ma;
        }
      `,
      errors: [
        {
          messageId: "errorStringArrowFunctionExpression",
          type: AST_NODE_TYPES.ReturnStatement,
        },
      ],
    },
    // mutable function return -> readonly function return (as part of intersection with object).
    {
      filename: "file.ts",
      code: `
        type RandomObject = { readonly b?: string };
        type MutableA = RandomObject & (() => { a: string });
        type ReadonlyA = RandomObject & (() => { readonly a: string });

        const ma: MutableA = () => ({ a: "" });
        const ra: ReadonlyA = ma;
      `,
      errors: [
        {
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // mutable object prop -> readonly object prop (as part of intersection with non-object).
    {
      filename: "file.ts",
      code: `
        type MutableA = { a?: string } & number;
        type ReadonlyA = { readonly a?: string } & number;

        const ma: MutableA = 42;
        const ra: ReadonlyA = ma;      
      `,
      errors: [
        {
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // Return empty mutable array from function that is declared to return empty tuple.
    {
      filename: "file.ts",
      code: `
        const foo = (): readonly [] => {
          return [];
        };
      `,
      errors: [
        {
          messageId: "errorStringArrowFunctionExpression",
          type: AST_NODE_TYPES.ReturnStatement,
        },
      ],
    },
    // mutable function return -> readonly function return (multiple call signatures).
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        interface MutableFunc {
          (b: number): MutableA;
          (b: string): MutableA;
        }

        interface ReadonlyFunc {
          (b: number): ReadonlyA;
          (b: string): ReadonlyA;
        }

        const mf: MutableFunc = (b: number | string): MutableA => {
          return { a: "" };
        };

        const rf: ReadonlyFunc = mf;
      `,
      errors: [
        {
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
  ],
} as const);
