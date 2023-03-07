/* eslint-disable functional/prefer-immutable-types */
import { createRule } from "./common";

/**
 * An ESLint rule to ban enums.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noEnums = createRule({
  name: "no-enums",
  meta: {
    type: "problem",
    docs: {
      description: "Bans enums.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric: "Don't declare enums.",
    },
    schema: [],
  },
  create: (context) => {
    return {
      // eslint-disable-next-line functional/no-return-void
      TSEnumDeclaration: (node) => {
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

export default noEnums;
