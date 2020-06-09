import type { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { ESLintUtils } from "@typescript-eslint/experimental-utils";
import { isTupleTypeReference, isObjectType } from "tsutils";

/**
 * An ESLint rule to ban usage of the array index operator, which is not well-typed in TypeScript.
 * @see https://github.com/Microsoft/TypeScript/issues/13778
 * @see https://github.com/estree/estree/blob/master/es5.md#memberexpression
 */
const noArraySubscript: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors" as const,
      description: "Array subscript access is not type-safe in TypeScript.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric:
        "Array and object subscript access is not type-safe in TypeScript.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      // eslint-disable-next-line functional/no-return-void
      MemberExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (!node.computed) {
          // Allow non-computed (regular) property access.
          return;
        }

        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.object);
        const type = checker.getTypeAtLocation(tsNode);

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isTupleTypeReference(type) &&
          node.property.type === "Literal" &&
          typeof node.property.value === "number" &&
          node.property.value <= type.target.minLength
        ) {
          // Allow tuples (with or without a ...rest element) if
          // the index we're accessing is know to be safe at compile time.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isObjectType(type) &&
          node.property.type === "Literal" &&
          typeof node.property.value === "string" &&
          type.getProperty(node.property.value) !== undefined
        ) {
          // Allow object subscript access when it is known to be safe (this excludes records).
          return;
        }

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        });
      },
    };
  },
};

export default noArraySubscript;
