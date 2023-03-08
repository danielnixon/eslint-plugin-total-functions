/* eslint-disable functional/prefer-immutable-types */
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { createRule } from "./common";

/**
 * An ESLint rule to ban the partial URL construction.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noPartialUrlConstructor = createRule({
  name: "no-partial-url-constructor",
  meta: {
    type: "problem",
    docs: {
      description: "Bans the partial URL construction.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric:
        "Don't use the URL constructor directly because it can throw and because URLs are mutable. Instead, use `readonlyURL` from the readonly-types package.",
    },
    schema: [],
  },
  create: (context) => {
    return {
      // eslint-disable-next-line functional/no-return-void
      NewExpression: (node) => {
        // eslint-disable-next-line functional/no-conditional-statements
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          // TODO inspect the type instead of just relying on the type name.
          node.callee.name === "URL"
        ) {
          // eslint-disable-next-line functional/no-expression-statements
          context.report({
            node: node,
            messageId: "errorStringGeneric",
          } as const);
        }
      },
    };
  },
  defaultOptions: [],
} as const);

export default noPartialUrlConstructor;
