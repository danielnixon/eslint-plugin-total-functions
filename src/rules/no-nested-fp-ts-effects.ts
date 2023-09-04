/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils } from "@typescript-eslint/utils";
import { isThenableType } from "tsutils";
import { createRule, typeSymbolName } from "./common";
import { effects, fpTsEffectType } from "./fp-ts";

/**
 * An ESLint rule to ban problematic nested fp-ts effects.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noNestedFpTsEffects = createRule({
  name: "no-nested-fp-ts-effects",
  meta: {
    type: "problem",
    docs: {
      description: "Bans problematic nested fp-ts effects.",
      recommended: "error",
    },
    messages: {
      errorStringGeneric: "Do not nest these fp-ts effects.",
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

        // TODO report other types of problematic nesting besides Tasks within IOs.
        // eslint-disable-next-line functional/no-conditional-statements
        if (
          effectType.effectName === "IO" &&
          effectType.effectTypeParameter !== undefined
        ) {
          const effectTypeParameterName = typeSymbolName(
            effectType.effectTypeParameter,
          );
          // eslint-disable-next-line functional/no-conditional-statements
          if (effectTypeParameterName === undefined) {
            return;
          }
          const isNestedEffect = effects.includes(effectTypeParameterName);

          const isNestedPromise = isThenableType(
            checker,
            tsNode,
            effectType.effectTypeParameter,
          );

          // eslint-disable-next-line functional/no-conditional-statements
          if (isNestedEffect || isNestedPromise) {
            // eslint-disable-next-line functional/no-expression-statements
            context.report({
              node: node,
              messageId: "errorStringGeneric",
            } as const);
          }
        }
      },
    };
  },
  defaultOptions: [],
} as const);

export default noNestedFpTsEffects;
