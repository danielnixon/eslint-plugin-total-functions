import rule from "./no-unsafe-readonly-mutable-assignment";
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
ruleTester.run("no-unsafe-readonly-mutable-assignment", rule, {
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
    // readonly -> readonly (type doesn't change)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        const readonlyA: ReadonlyA = { a: "" };
        func(readonlyA);
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
        const readonlyA: ReadonlyA = { a: { b: "" } };
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
        func({ a: b });
      `,
    },
    // object literal -> readonly (mutable reference to property retained)
    {
      filename: "file.ts",
      code: `
        type MutableB = { b: string };
        type ReadonlyA = { readonly a: { readonly b: string } };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        const b: MutableB = { b: "" };
        func({ a: b });
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
        const b: ReadonlyB = { b: "" };
        func({ a: b });
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
        func({ a: { b: "" } });
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

        const readonlyA: ReadonlyA = { a: "" };
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

        const readonlyA: ReadonlyA = { a: "" };
        func(readonlyA);
      `,
    },
    // readonly array concat.
    {
      filename: "file.ts",
      code: `
        const arr: ReadonlyArray<never> = [];
        const foo = arr.concat(arr, arr);
      `,
    },
    // mutable array concat.
    {
      filename: "file.ts",
      code: `
        const arr: Array<never> = [];
        const foo = arr.concat(arr, arr);
      `,
    },
    // Mixed mutable and readonly array concat.
    // TODO this should be invalid.
    {
      filename: "file.ts",
      code: `
        const ro: ReadonlyArray<never> = [];
        const mut: Array<never> = [];
        const foo = ro.concat(ro, mut);
      `,
    },
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
        const foo: MutableA | ReadonlyB = Date.now() > 0 ? { a: "" } : { b: "" };
        func(foo);
      `,
    },
    // Recursive type (linting must terminate)
    {
      filename: "file.ts",
      code: `
        type Foo = ReadonlyArray<Foo>;
        const func = (foo: Foo): void => {
          return;
        };
        const foo: Foo = [[]];
        func(foo);
      `,
    },
    {
      filename: "file.ts",
      code: `
        const foo = document.createElement("div");
      `,
    },
    // readonly array of readonly object -> readonly array of readonly object
    {
      filename: "file.ts",
      code: `
        type Obj = { readonly foo: string };
        const foo = (a: ReadonlyArray<Obj>): number => a.length;
        const arr: ReadonlyArray<Obj> = [];
        foo(arr);
      `,
    },
    /**
     * Assignment expressions
     */
    // TODO
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
          const ma: ReadonlyA = { a: "" };
          return ma;
        }
      `,
    },
    // void (function return)
    {
      filename: "file.ts",
      code: `
        function foo(): void {
          return;
        }
      `,
    },
    // https://github.com/danielnixon/eslint-plugin-total-functions/issues/577
    {
      filename: "file.ts",
      code: `
        const arr : readonly number[] = [];
        const obj : {} = arr;
        const it1 : Iterable<number> = arr;
        const it2 : Readonly<Iterable<number>> = arr;
      `,
    },
    // multiple call signatures, recursive
    // TODO fix stack overflow properly instead of just terminating iteration arbitrarily
    {
      filename: "file.ts",
      code: `
        interface Foo<A extends object> {
          <B extends {}>(b: Foo<B> & { b: Foo<B> }): Foo<A & B>;
          <C extends Foo<any>>(b: Foo<C> & { b: Foo<C> }): Foo<A & C>;
        }

        declare const a: Foo<{ a: string }>;

        const b = a as Foo<{ b: string }>;
      `,
    },
    {
      filename: "file.ts",
      code: `
        interface Foo<A extends object> {
          <C extends Foo<any>>(b: Foo<C> & { b: Foo<C> }): Foo<A & C>;
        }

        declare const a: Foo<{ a: string }>;

        const b = a as Foo<{ b: string }>;
      `,
    },
    {
      filename: "file.ts",
      code: `
        declare const foo: string;
        const bar: string | { a: string } = foo;
      `,
    },
  ],
  invalid: [
    // object literal -> mutable (readonly reference to property retained)
    // this can lead to surprising mutation in the readonly reference that is retained
    {
      filename: "file.ts",
      code: `
        type MutableB = { b: string };
        type ReadonlyB = { readonly b: string };
        type MutableA = { readonly a: MutableB };
        const func = (param: MutableA): void => {
          return undefined;
        };
        const b: ReadonlyB = { b: "" };
        func({ a: b } as const);
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // readonly -> mutable (rest parameter)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const foo = (...as: readonly MutableA[]): void => {
          return;
        };
        
        const ma: MutableA = { a: "" };
        const ra: ReadonlyA = { a: "" };
        
        foo(ma, ra);
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // readonly (union) -> mutable (union)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        type MutableB = { b: string };
        type ReadonlyB = { readonly b: string };
        const mutate = (mut: MutableA | MutableB): void => {
          return;
        };
        const ro: ReadonlyA | ReadonlyB = { a: "" };
        mutate(ro);
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // readonly (union) -> mixed (union)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        type MutableB = { b: string };
        type ReadonlyB = { readonly b: string };
        const mutate = (mut: ReadonlyA | MutableB): void => {
          return;
        };
        const ro: ReadonlyA | ReadonlyB = Date.now() > 0 ? { a: "" } : { b: "" };
        mutate(ro);
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    /**
     * Assignment expressions
     */
    // readonly -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const readonlyA: ReadonlyA = { a: "readonly?" };
        let mutableA: MutableA;
        mutableA = readonlyA;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.AssignmentExpression,
        },
      ],
    },
    // readonly -> mutable (short-circuiting assignment)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const readonlyA: ReadonlyA = { a: "readonly?" };
        let mutableA: MutableA | undefined;
        mutableA ??= readonlyA;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.AssignmentExpression,
        },
      ],
    },
    /**
     * Variable declaration
     */
    // readonly (type) -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const readonlyA: ReadonlyA = { a: "readonly?" };
        const mutableA: MutableA = readonlyA;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // readonly (class) -> mutable
    // this is arguably worse than the above because instead of surprise mutation it results in a TypeError
    {
      filename: "file.ts",
      code: `
        class Box {
          get area(): number {
            return 42;
          }
        }
        type Area = {
          area: number;
        };
        const a: Area = new Box();
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // readonly (string index type) -> mutable (string index type)
    {
      filename: "file.ts",
      code: `
        type MutableA = Record<string, { a: string }>;
        type ReadonlyA = Record<string, { readonly a: string }>;
        const readonlyA: ReadonlyA = {};
        const mutableA: MutableA = readonlyA;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // readonly (string index signature) -> mutable (string index signature) (recursive types)
    {
      filename: "file.ts",
      code: `
        type MutableA = {
          [P in string]: MutableA;
        };
        type ReadonlyA = {
          readonly [P in string]: ReadonlyA;
        };
        const readonlyA: ReadonlyA = {};
        const mutableA: MutableA = readonlyA;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // readonly (number index signature) -> mutable (number index signature) (recursive types)
    {
      filename: "file.ts",
      code: `
        type MutableA = {
          [P in number]: MutableA;
        };
        type ReadonlyA = {
          readonly [P in number]: ReadonlyA;
        };
        const readonlyA: ReadonlyA = {};
        const mutableA: MutableA = readonlyA;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    /**
     * Return statement
     */
    // readonly -> mutable (function return)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        function foo(): MutableA {
          const ma: ReadonlyA = { a: "" };
          return ma;
        }
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ReturnStatement,
        },
      ],
    },
  ],
} as const);
