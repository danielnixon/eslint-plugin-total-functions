import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { ESLintUtils, TSESTree } from "@typescript-eslint/experimental-utils";
import ts from "typescript";
import { isTypeFlagSet } from "tsutils";

/**
 * An ESLint rule to ban unsafe type assertions.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noUnsafeTypeAssertion: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      description: "Bans unsafe type assertions.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric: "This type assertion is not type-safe.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const isUnsafe = (
      rawDestinationType: ts.Type,
      rawSourceType: ts.Type
    ): boolean => {
      // eslint-disable-next-line functional/no-conditional-statement
      if (
        isTypeFlagSet(rawSourceType, ts.TypeFlags.Any) ||
        isTypeFlagSet(rawSourceType, ts.TypeFlags.Unknown)
      ) {
        // Asserting any or unknown to anything else is always unsafe.
        return true;
      }

      return !checker.isTypeAssignableTo(rawSourceType, rawDestinationType);
    };

    const reportUnsafe = (
      node: TSESTree.TSTypeAssertion | TSESTree.TSAsExpression
      // eslint-disable-next-line functional/no-return-void
    ): void => {
      // The right hand side of the "as".
      const destinationNode = parserServices.esTreeNodeToTSNodeMap.get(node);
      const rawDestinationType = checker.getTypeAtLocation(destinationNode);

      // The left hand side of the "as".
      const sourceNode = destinationNode.expression;
      const rawSourceType = checker.getTypeAtLocation(sourceNode);

      // eslint-disable-next-line functional/no-conditional-statement
      if (isUnsafe(rawDestinationType, rawSourceType)) {
        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        } as const);
      }
    };

    return {
      TSTypeAssertion: reportUnsafe,
      TSAsExpression: reportUnsafe,
    };
  },
} as const;

export default noUnsafeTypeAssertion;
