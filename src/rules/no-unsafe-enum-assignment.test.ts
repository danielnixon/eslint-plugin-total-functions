import rule from "./no-unsafe-enum-assignment";
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
ruleTester.run("no-unsafe-enum-assignment", rule, {
  valid: [
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        const zeroOrOne: ZeroOrOne = ZeroOrOne.Zero;
      `,
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        const zeroOrOne = ZeroOrOne.Zero;
      `,
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        let zeroOrOne: ZeroOrOne;
      `,
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }

        enum TwoOrThree {
          Two = 2,
          Three = 3,
        }
        
        // Caught by the TypeScript compiler so no need to be caught by this rule.
        const zeroOrOne: ZeroOrOne = TwoOrThree.Two;
      `,
    },
    {
      filename: "file.ts",
      code: `        
        const foo = () => 2;
      `,
    },
    {
      filename: "file.ts",
      code: `        
      enum ZeroOrOne {
        Zero = 0,
        One = 1,
      }

      let zeroOrOne: ZeroOrOne | string;

      zeroOrOne = ZeroOrOne.One;

      zeroOrOne = "";
      `,
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }

        export function* mySaga(): Generator<ZeroOrOne> {
          yield ZeroOrOne.One;
        }
      `,
    },
    {
      filename: "file.ts",
      code: `
        export function* mySaga(): Generator<void> {
          yield;
        }
      `,
    },
  ],
  invalid: [
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        const zeroOrOne: ZeroOrOne = 1;
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
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        const zeroOrOne: ZeroOrOne = 2;
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
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        let zeroOrOne: ZeroOrOne;

        zeroOrOne = 2;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.AssignmentExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `        
      enum ZeroOrOne {
        Zero = 0,
        One = 1,
      }

      let zeroOrOne: ZeroOrOne | string;

      zeroOrOne = 2;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.AssignmentExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        function foo(): ZeroOrOne {
          return 2;
        }
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ReturnStatement,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        const foo = (): ZeroOrOne => 2;
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.ArrowFunctionExpression,
        },
      ],
    },
    {
      filename: "file.ts",
      code: `
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }
        
        const foo = (zeroOrOne: ZeroOrOne): void => {
          return;
        };
        
        foo(2);
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
        enum ZeroOrOne {
          Zero = 0,
          One = 1,
        }

        export function* mySaga(): Generator<ZeroOrOne> {
          yield 2;
        }
      `,
      errors: [
        {
          messageId: "errorStringGeneric",
          type: AST_NODE_TYPES.YieldExpression,
        },
      ],
    },
  ],
} as const);
