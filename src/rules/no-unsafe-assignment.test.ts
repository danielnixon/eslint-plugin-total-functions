import rule from "./no-unsafe-assignment";
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
ruleTester.run("no-unsafe-assignment", rule, {
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
    // object literal -> readonly (no reference to object retained)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        func({ a: "" });
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
    // mutable -> mutable (type changes)
    // todo this should be invalid
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
    // mutable -> readonly
    // todo this should be invalid
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
    },
    // multiple type signatures (readonly -> readonly)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = { readonly a: string };
        
        export function func(a: MutableA): MutableA;
        export function func(a: ReadonlyA): ReadonlyA;
        export function func(a: any): any {
          return a;
        }
        
        const readonlyA: ReadonlyA = { a: "" };
        func(readonlyA);
      `,
    },
    // multiple type signatures (readonly -> mutable)
    // TODO this should be invalid
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
    },
    /**
     * Assignment expressions
     */
    // TODO
    /**
     * Variable declaration
     */
    // readonly array prop with readonly generic type -> readonly array prop with mutable generic type
    // TODO this should be invalid
    {
      filename: "file.ts",
      code: `
        type MutableA = { readonly a: ReadonlyArray<{ b: string }> };
        type ReadonlyA = { readonly a: ReadonlyArray<{ readonly b: string }> };
        
        const readonlyA: ReadonlyA = { a: [] };
        const mutableA: MutableA = readonlyA;
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
          messageId: "errorStringCallExpressionReadonlyToMutable",
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
          messageId: "errorStringCallExpressionReadonlyToMutable",
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
          messageId: "errorStringAssignmentExpressionReadonlyToMutable",
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
          messageId: "errorStringVariableDeclarationReadonlyToMutable",
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
          messageId: "errorStringVariableDeclarationReadonlyToMutable",
          type: AST_NODE_TYPES.VariableDeclaration,
        },
      ],
    },
  ],
});
