import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import rule from "./no-unsafe-mutable-readonly-assignment";

// eslint-disable-next-line functional/prefer-immutable-types
const ruleTester = new ESLintUtils.RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: "@typescript-eslint/parser",
});

// eslint-disable-next-line functional/no-expression-statements
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
    // Array safe mutable to readonly assignment with chained array operations.
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        const nextArray: readonly string[] = fooArray.filter((v) => v.length > 0).map((v) => v.length.toString());
      `,
    },
    // Array safe mutable to readonly assignment. (array.filter)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = [""] as const;
        const nextArray: readonly string[] = fooArray.filter((v) => v.length > 0);
      `,
    },
    // Array safe mutable to readonly assignment. (array.map)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        const nextArray: readonly string[] = fooArray.map((v) => v.length.toString());
      `,
    },
    // Array safe mutable to readonly assignment. (array.concat)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test-1"] as const;
        const booArray: readonly string[] = ["test-2"] as const;
        const nextArray: readonly string[] = fooArray.concat(booArray);
      `,
    },
    // Array safe mutable to readonly assignment. (array.flatMap)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[][] = [["test"]] as const;
        const nextArray: readonly string[] = fooArray.flatMap((v) => v.length.toString());
      `,
    },
    // Array safe mutable to readonly assignment. (array.flat)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[][] = [["test"]] as const;
        const nextArray: readonly string[] = fooArray.flat();
      `,
    },
    // Array safe mutable to readonly assignment. (array.slice)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        const nextArray: readonly string[] = fooArray.slice();
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
    // Return safe mutable array with chained array operations.
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        const nextArray = (): readonly string[] => fooArray.filter((v) => v.length > 0).map((v) => v.length.toString());
      `,
    },
    // Return safe mutable array. (array.filter)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = [""] as const;
        const nextArray = (): readonly string[] => fooArray.filter((v) => v.length > 0);
      `,
    },
    // Return safe mutable array. (array.map)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        const nextArray = (): readonly string[] => fooArray.map((v) => v.length.toString());
      `,
    },
    // Return safe mutable array. (array.concat)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test-1"] as const;
        const booArray: readonly string[] = ["test-2"] as const;
        const nextArray = (): readonly string[] => fooArray.concat(booArray);
      `,
    },
    // Return safe mutable array. (array.flatMap)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[][] = [["test"]] as const;
        const nextArray = (): readonly string[] => fooArray.flatMap((v) => v.length.toString());
      `,
    },
    // Return safe mutable array. (array.flat)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[][] = [["test"]] as const;
        const nextArray = (): readonly string[] => fooArray.flat();
      `,
    },
    // Return safe mutable array. (array.slice)
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        const nextArray = (): readonly string[] => fooArray.slice();
      `,
    },
    // Return safe mutable array.
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        const nextArray = (): readonly string[] => {
          return fooArray.slice();
        }
      `,
    },
    // Yield safe mutable array.
    {
      filename: "file.ts",
      code: `
        const fooArray: readonly string[] = ["test"] as const;
        export function* mySaga(): Generator<readonly string[]> {
          yield fooArray.slice();
        }
      `,
    },
    // generators
    {
      filename: "file.ts",
      code: `
        export function* mySaga(): Generator<void> {
          yield;
        }
      `,
    },
    // The five turtles.
    // https://effectivetypescript.com/2021/05/06/unsoundness/#There-Are-Five-Turtles
    // https://www.youtube.com/watch?v=wpgKd-rwnMw&t=1714s
    {
      filename: "file.ts",
      code: `
        type Foo<U> = {
          readonly a: U;
          readonly b: Foo<Foo<U>>;
        };
        
        type Bar<U> = {
          readonly a: U;
          readonly b: Bar<Bar<U>>;
        };
        
        declare const foo: Foo<string>;
        
        const bar: Bar<string> = foo;
      `,
    },
    {
      filename: "file.ts",
      code: `
        type Foo<U> = {
          readonly a: U;
          readonly b: () => Foo<Foo<U>>;
        };
        
        type Bar<U> = {
          readonly a: U;
          readonly b: () => Bar<Bar<U>>;
        };
        
        declare const foo: Foo<string>;
        
        const bar: Bar<string> = foo;
      `,
    },
    // Return empty array literal from function that is declared to return empty tuple.
    {
      filename: "file.ts",
      code: `
        const foo = (): readonly [] => {
          return [];
        };
      `,
    },
    // https://github.com/danielnixon/eslint-plugin-total-functions/issues/741
    {
      filename: "file.ts",
      code: `
        type Foo<U> = {
          b?: Foo<Foo<U>>;
        };
        
        const takesAFoo = <U>(foo: Foo<U>): void => {
          return undefined;
        }
        
        let foo: Foo<unknown> = { b: {} };
        
        foo.b = foo;
        
        takesAFoo(foo);
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
          messageId: "errorStringGeneric",
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
    //       messageId: "errorStringGeneric",
    //       type: AST_NODE_TYPES.Identifier,
    //     },
    //   ],
    // },
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
          messageId: "errorStringGeneric",
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
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ReturnStatement,
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
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // mutable function value -> readonly.
    {
      filename: "file.ts",
      code: `
        type MyType = {
          readonly filter: () => Record<string, string>;
        };

        const myValue: MyType = {
          filter: () => ({ foo: "bar" }),
        } as const;

        const foo: Readonly<Record<string, string>> = myValue.filter();
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // mutable function array value -> readonly.
    {
      filename: "file.ts",
      code: `
        type MyType = {
          readonly filter: () => string[];
        };

        const myValue: MyType = {
          filter: () => (["bar"]),
        } as const;

        const foo: readonly string[] = myValue.filter();
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        type MyReadonlyType = { readonly a: string };
        type MyMutableType = { a: string };
        
        const mutableVal: MyMutableType = { a: "" };
        const readonlyArrayOfMutable: readonly MyMutableType[] = [mutableVal] as const;
        
        const shouldBeImmutable: readonly MyReadonlyType[] =
          readonlyArrayOfMutable.concat({
            a: "",
          });
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // yield expression (generator)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        export function* mySaga(): Generator<ReadonlyA> {
          const foo: MutableA = { a: "" };
          yield foo;
        }
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.YieldExpression,
        },
      ],
    },
    // deep(ish) type
    {
      filename: "file.ts",
      code: `
        type A = {
          a: string;
        };
        
        type B = {
          readonly a: A;
        };
        
        type C = {
          readonly b: B;
        };
        
        type D = {
          readonly c: C;
        };
        
        type E = {
          readonly d: D;
        };
        
        type F = {
          readonly e: E;
        };
        
        type G = {
          readonly f: F;
        };
        
        type A2 = {
          readonly a: string;
        };
        
        type B2 = {
          readonly a: A2;
        };
        
        type C2 = {
          readonly b: B2;
        };
        
        type D2 = {
          readonly c: C2;
        };
        
        type E2 = {
          readonly d: D2;
        };
        
        type F2 = {
          readonly e: E2;
        };
        
        type G2 = {
          readonly f: F2;
        };
        
        declare const g: G;
        export const g2: G2 = g;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
  ],
} as const);
