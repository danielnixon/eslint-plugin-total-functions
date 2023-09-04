/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils } from "@typescript-eslint/utils";
import { createRule } from "./common";
import { fpTsEffectType } from "./fp-ts";

/**
 * An ESLint rule to ban interpretation (execution) of fp-ts effects.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noPrematureFpTsEffects = createRule({
  name: "no-premature-fp-ts-effects",
  meta: {
    type: "problem",
    docs: {
      description: "Bans interpretation (execution) of fp-ts effects.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric:
        "Ensure you aren't interpreting this fp-ts effect until the very end of your program.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      // eslint-disable-next-line functional/no-return-void
      CallExpression: (node) => {
        // eslint-disable-next-line functional/no-conditional-statements
        if (node.arguments.length > 0) {
          return;
        }

        const calleeNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.callee,
        );
        const calleeType = checker.getTypeAtLocation(calleeNode);

        const effectType = fpTsEffectType(calleeType);

        // eslint-disable-next-line functional/no-conditional-statements
        if (effectType === undefined) {
          return;
        }

        // TODO: don't flag error if we can confirm we are at the program entrypoint.

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

export default noPrematureFpTsEffects;
