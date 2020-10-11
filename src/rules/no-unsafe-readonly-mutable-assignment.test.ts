import rule from "./no-unsafe-readonly-mutable-assignment";
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
    // why does this hang?
    // TODO fix
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
    // readonly function parameter -> mutable function parameter
    // (contravariant position so not flagged by this rule)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const takesMutable = (f: (roa: MutableA) => void): void => undefined;

        takesMutable((roa: ReadonlyA): void => undefined);
      `,
    },
    // readonly function parameter -> mutable function parameter (rest param)
    // (contravariant position so not flagged by this rule)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const takesMutable = (f: (...roa: readonly MutableA[]) => void): void => undefined;

        takesMutable((...roa: readonly MutableA[]): void => undefined);
      `,
    },
    // readonly function parameter -> readonly function parameter (rest param array is mutable -> readonly)
    // TODO should we flag this?
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const takesReadonly = (f: (...roa: readonly ReadonlyA[]) => void): void => undefined;

        takesReadonly((...roa: MutableA[]): void => undefined);
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
        const ro: ReadonlyA = { a: "" };
        const func = (): ReadonlyA => ro;
      `,
    },
    // Arrow function (compact form) (object literal -> readonly)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const func = (): ReadonlyA => { a: "" };
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
        const ro: ReadonlyA = { a: "" };
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
    // mutable -> readonly
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: MutableA = { a: "" };
        const mut = ro as ReadonlyA;
      `,
    },
    // readonly -> readonly
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" };
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
    // mutable -> readonly
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: MutableA = { a: "" };
        const mut = <ReadonlyA>ro;
      `,
    },
    // Symbol.declarations claims to be of type Declaration[] but it's really Declaration[] | undefined
    // This test exercises the case where it is undefined to ensure we handle it appropriately.
    // TODO: what else in the typescript lib lies about its type?
    // TODO: use patch-package to fix this type, forcing us to handle it.
    {
      filename: "file.ts",
      code: `
        Object.keys({}) as ReadonlyArray<string>;
      `,
    },
    // as const
    {
      filename: "file.ts",
      code: `
        const foo: readonly string[] = [];

        const bar = [
          { key: -1, value: "" },
          ...foo.map((c, i) => ({
            key: i,
            value: c,
          })),
        ] as const;
      `,
    },
    // <const>
    {
      filename: "file.ts",
      code: `
        const foo: readonly string[] = [];

        const bar = <const>[
          { key: -1, value: "" },
          ...foo.map((c, i) => ({
            key: i,
            value: c,
          })),
        ];
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
  ],
  invalid: [
    /**
     * Call expressions
     */
    // readonly -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const mutate = (mut: MutableA): void => {
          mut.a = "whoops";
        };
        const readonlyA: ReadonlyA = { a: "readonly?" };
        mutate(readonlyA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // readonly -> mutable (union)
    // this is invalid because it _could be_ readonly -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const mutate = (mixed: MutableA | undefined | null | number | string | boolean): void => {
          return;
        };
        const mixedA: ReadonlyA = { a: "readonly?" };
        mutate(mixedA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // readonly (union) -> mutable (union)
    // this is invalid because it _could be_ readonly -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const mutate = (mixed: MutableA | undefined | null): void => {
          return;
        };
        const mixedA: ReadonlyA | undefined | null = { a: "readonly?" };
        mutate(mixedA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // callee has multiple type signatures (readonly -> mutable)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        export function func(a: MutableA): MutableA;
        export function func(a: number): number;
        export function func(a: any): any {
          return a;
        }

        const readonlyA: ReadonlyA = { a: "" };
        func(readonlyA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // readonly -> mutable (nested object)
    {
      filename: "file.ts",
      code: `
        type MutableA = { readonly a: { b: string } };
        type ReadonlyA = { readonly a: { readonly b: string } };
        const mutate = (mut: MutableA): void => {
          mut.a.b = "whoops";
        };
        const readonlyA: ReadonlyA = { a: { b: "readonly?" } };
        mutate(readonlyA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
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
        func({ a: b });
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.ObjectExpression,
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
          messageId: "errorStringCallExpression",
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
          messageId: "errorStringCallExpression",
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
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // readonly function return type -> mutable function return type.
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const mutate = (mut: () => MutableA): void => {
          const mutable = mut();
          mutable.a = "whoops";
        };

        const ro: ReadonlyA = { a: "" } as const;

        mutate((): ReadonlyA => ro);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.ArrowFunctionExpression,
        },
      ],
    },
    // mutable function parameter -> readonly function parameter
    // (contravariant position)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const takesReadonly = (f: (roa: ReadonlyA) => void): void => undefined;

        takesReadonly((ma: MutableA): void => undefined);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.ArrowFunctionExpression,
        },
      ],
    },
    // mutable function parameter -> readonly function parameter (rest param)
    // (contravariant position)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };

        const takesReadonly = (f: (...roa: readonly ReadonlyA[]) => void): void => undefined;

        takesReadonly((...ma: readonly MutableA[]): void => undefined);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.ArrowFunctionExpression,
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
          messageId: "errorStringAssignmentExpression",
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
          messageId: "errorStringAssignmentExpression",
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
          messageId: "errorStringVariableDeclaration",
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
          messageId: "errorStringVariableDeclaration",
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
          messageId: "errorStringVariableDeclaration",
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
          messageId: "errorStringVariableDeclaration",
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
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    // readonly array prop with readonly generic type -> readonly array prop with mutable generic type
    {
      filename: "file.ts",
      code: `
        type MutableA = { readonly a: ReadonlyArray<{ b: string }> };
        type ReadonlyA = { readonly a: ReadonlyArray<{ readonly b: string }> };

        const readonlyA: ReadonlyA = { a: [] };
        const mutableA: MutableA = readonlyA;
      `,
      errors: [
        {
          messageId: "errorStringVariableDeclaration",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
    /**
     * Arrow functions
     */
    // Arrow function (compact form) (readonly -> mutable)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" };
        const func = (): MutableA => ro;
      `,
      errors: [
        {
          messageId: "errorStringArrowFunctionExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    /**
     * type assertions
     */
    // readonly -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" };
        const mut = ro as MutableA;
      `,
      errors: [
        {
          messageId: "errorStringTSAsExpression",
          type: AST_NODE_TYPES.TSAsExpression,
        },
      ],
    },
    // readonly -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" };
        const mut = <MutableA>ro;
      `,
      errors: [
        {
          messageId: "errorStringTSTypeAssertion",
          type: AST_NODE_TYPES.TSTypeAssertion,
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
          messageId: "errorStringArrowFunctionExpression",
          type: AST_NODE_TYPES.ReturnStatement,
        },
      ],
    },
    // Arrow function (block form) (readonly -> mutable)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        const ro: ReadonlyA = { a: "" };
        const func = (): MutableA => {
          return ro;
        };
      `,
      errors: [
        {
          messageId: "errorStringArrowFunctionExpression",
          type: AST_NODE_TYPES.ReturnStatement,
        },
      ],
    },
  ],
} as const);
