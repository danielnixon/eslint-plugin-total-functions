/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils } from "@typescript-eslint/utils";
import { createRule } from "./common";
import { fpTsEffectType } from "./fp-ts";

/**
 * An ESLint rule to ban nested fp-ts effects.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noNestedFpTsEffects = createRule({
  name: "no-nested-fp-ts-effects",
  meta: {
    type: "problem",
    docs: {
      description: "Bans nested fp-ts effects.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric: "Do not nest effects.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      // eslint-disable-next-line functional/no-return-void
      CallExpression: (node) => {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        const expressionType = checker.getTypeAtLocation(tsNode);

        const effectType = fpTsEffectType(expressionType);

        // eslint-disable-next-line functional/no-conditional-statements
        if (effectType === undefined) {
          return;
        }

        const nestedEffectType = fpTsEffectType(effectType.typeParameter);

        // eslint-disable-next-line functional/no-conditional-statements
        if (nestedEffectType === undefined) {
          return;
        }

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

export default noNestedFpTsEffects;
