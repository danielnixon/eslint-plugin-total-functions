/* eslint-disable functional/prefer-immutable-types */
import { isTypeFlagSet } from "@typescript-eslint/type-utils";
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { BigIntLiteralType, TypeFlags } from "typescript";
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
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

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

        // eslint-disable-next-line functional/no-conditional-statements
        if (node.right.type === AST_NODE_TYPES.Identifier) {
          const denominatorNode = parserServices.esTreeNodeToTSNodeMap.get(
            node.right
          );
          const denominatorNodeType =
            checker.getTypeAtLocation(denominatorNode);

          // eslint-disable-next-line functional/no-conditional-statements
          if (
            isTypeFlagSet(denominatorNodeType, TypeFlags.NumberLike) &&
            denominatorNodeType.isNumberLiteral() &&
            denominatorNodeType.value !== 0
          ) {
            // Division by a number type that is known to be non-zero is safe.
            return;
          }

          // TODO find a way to get ahold of a BigIntLiteralType without type assertions.
          // There is no equivalent of `isNumberLiteral()` for bigints.
          // `isLiteral()` returns false so isn't useful.
          const bigIntBase10Value =
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unnecessary-condition
            (denominatorNodeType as Partial<BigIntLiteralType>)?.value
              ?.base10Value;

          // eslint-disable-next-line functional/no-conditional-statements
          if (bigIntBase10Value !== undefined && bigIntBase10Value !== "0") {
            // Division by a bigint type that is known to be non-zero is safe.
            return;
          }
        }

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
