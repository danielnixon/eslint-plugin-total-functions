/* eslint-disable functional/prefer-immutable-types */
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { intersectionTypeParts, unionTypeParts } from "tsutils";
import { BigIntLiteralType, PseudoBigInt, Type } from "typescript";
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

    // TODO find a way to get ahold of a BigIntLiteralType without type assertions.
    // There is no equivalent of `isNumberLiteral()` for bigints.
    // `isLiteral()` returns false so isn't useful.
    const isPseudoBigInt = (val: unknown): val is PseudoBigInt => {
      const valAsPseudoBigInt =
        typeof val === "object" && val !== null
          ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            (val as Partial<PseudoBigInt>)
          : undefined;
      return (
        valAsPseudoBigInt !== undefined &&
        typeof valAsPseudoBigInt.base10Value === "string" &&
        typeof valAsPseudoBigInt.negative === "boolean"
      );
    };

    const isBigIntLiteral = (type: Type): type is BigIntLiteralType => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unnecessary-condition
      return isPseudoBigInt((type as Partial<BigIntLiteralType>)?.value);
    };

    const isSafeDenominator = (type: Type): boolean => {
      // eslint-disable-next-line functional/no-conditional-statements
      if (type.isIntersection()) {
        const numberLiteralParts = intersectionTypeParts(type).filter(
          (t) => isBigIntLiteral(t) || t.isNumberLiteral()
        );
        return (
          numberLiteralParts.length > 0 &&
          numberLiteralParts.every((t) => isSafeDenominator(t))
        );
      }

      // eslint-disable-next-line functional/no-conditional-statements
      if (type.isUnion()) {
        return unionTypeParts(type).every((t) => isSafeDenominator(t));
      }

      return (
        (type.isNumberLiteral() && type.value !== 0) ||
        (isBigIntLiteral(type) && type.value.base10Value !== "0")
      );
    };

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
          if (isSafeDenominator(denominatorNodeType)) {
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
