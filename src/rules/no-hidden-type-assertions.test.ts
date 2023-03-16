import rule from "./no-hidden-type-assertions";
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
ruleTester.run("no-hidden-type-assertions", rule, {
  valid: [
    // No call signature
    {
      filename: "file.ts",
      code: `
        foo()
      `,
    },
    // Hidden type assertion but set to `unknown`
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T = any>(url: string) => Promise<T>;
        }
        declare const axios: Axios;
        export const result: Promise<unknown> = axios.request<unknown>("hello");
      `,
    },
    // Hidden type assertion but set to `never`
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T>() => Promise<T>;
        }
        declare const axios: Axios;
        export const result = axios.request<never>();
      `,
    },
    // Generic used in input value, explicitly provided
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T = any>(url: T) => T;
        }
        declare const axios: Axios;
        export const result: string = axios.request<string>("hello");
      `,
    },
    // Generic used in input value, not explicitly provided
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T = any>(url: T) => Promise<T>;
        }
        declare const axios: Axios;
        export const result = axios.request("hello");
      `,
    },
    // Generic used in input value, not explicitly provided, no default
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T>(url: T) => Promise<T>;
        }
        declare const axios: Axios;
        export const result = axios.request("hello");
      `,
    },
    // No generic
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: (url: string) => Promise<string>;
        }
        declare const axios: Axios;
        export const result: Promise<string> = axios.request("hello");
      `,
    },
    // Reused generic name
    {
      filename: "file.ts",
      code: `
        declare const foo: <T = any>(
          a: string,
          b: T
        ) => typeof a extends (infer T)[] ? T : typeof a;
        export const result = foo("hello", "world");
      `,
    },
    // function type parameter
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T = any>(url: () => T) => Promise<T>;
        }
        declare const axios: Axios;
        export const result = axios.request(() => "hello");
      `,
    },
    // chainFirstIOK
    {
      filename: "file.ts",
      code: `
        declare const chainFirstIOK: <A, B>(
          f: (a: A) => Promise<B>
        ) => (first: Promise<A>) => Promise<A>;
        
        export const result = chainFirstIOK<string, boolean>(() =>
          Promise.resolve(true)
        );
      `,
    },
    // object literal type hidden type assertion but set to unknown
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T = any>(url: string) => { t: T };
        }
        declare const axios: Axios;
        export const result = axios.request<unknown>("hello");
      `,
    },
    // TODO fix this case
    {
      filename: "file.ts",
      code: `
        declare const right: <E = never, A = never>(a: A) => E | A;
        export const result = right("hello");
      `,
    },
  ],
  invalid: [
    // Hidden type assertion set to arbitrary type
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T = any>(url: string) => Promise<T>;
        }

        declare const axios: Axios;

        export const result: Promise<boolean> = axios.request<boolean>("hello");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // Hidden type assertion set to parameter type coincidentally
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T = any>(url: string) => Promise<T>;
        }

        declare const axios: Axios;

        export const result: Promise<string> = axios.request<string>("hello");
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
        declare class Axios {
          readonly request: <T = any>(url: string) => T;
        }

        declare const axios: Axios;

        export const result: boolean = axios.request<boolean>("hello");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // index into type
    {
      filename: "file.ts",
      code: `
        declare class Axios {
          readonly request: <T extends { a: U }, U>(url: string) => Promise<T["a"]>;
        }

        declare const axios: Axios;

        export const result = axios.request("hello");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // conditional type
    {
      filename: "file.ts",
      code: `        
        declare class Axios {
          readonly request: <T>(
            url: string
          ) => T extends 42 ? 43 : 45;
        }
        
        declare const axios: Axios;
        
        export const result = axios.request<"asdf">("hello");
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.CallExpression,
        },
      ],
    },
    // TODO fix this case
    // object literal type
    // {
    //   filename: "file.ts",
    //   code: `
    //     declare class Axios {
    //       readonly request: <T = any>(url: string) => { t: T };
    //     }
    //     declare const axios: Axios;
    //     export const result = axios.request<boolean>("hello");
    //   `,
    //   errors: [
    //     {
    //       messageId: "errorStringGeneric",
    //       type: AST_NODE_TYPES.CallExpression,
    //     },
    //   ],
    // },
  ],
} as const);
