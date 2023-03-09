/* eslint-disable functional/prefer-immutable-types */
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { createRule } from "./common";

/**
 * An ESLint rule to ban partial division.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noPartialDivision = createRule({
  name: "no-partial-division",
  meta: {
    type: "problem",
    docs: {
      description: "Bans partial division.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric:
        "Division is partial. You should wrap it in a wrapper that returns undefined when the denominator is zero.",
    },
    schema: [],
  },
  create: (context) => {
    return {
      // eslint-disable-next-line functional/no-return-void
      BinaryExpression: (node) => {
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.operator !== "/") {
          // Binary expressions other than division are safe.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          node.right.type === AST_NODE_TYPES.Literal &&
          node.right.value !== 0 &&
          node.right.value !== 0n
        ) {
          // Division by a literal that isn't zero is safe.
          return;
        }

        // TODO expand this to inspect type information and not report an issue
        // if the type of the denominator is a literal numeric type (non-zero, of course)
        // even when not a literal value.

        // All other division is not provably safe.
        // eslint-disable-next-line functional/no-expression-statements
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        } as const);
      },
    };
  },
  defaultOptions: [],
} as const);

export default noPartialDivision;
