import type { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import {
  ESLintUtils,
  AST_NODE_TYPES,
} from "@typescript-eslint/experimental-utils";
import { isTupleTypeReference } from "tsutils";
import ts from "typescript";

/**
 * An ESLint rule to ban unsafe usage of the array/object index operator, which is not well-typed in TypeScript.
 * @see https://github.com/Microsoft/TypeScript/issues/13778
 */
const noArraySubscript: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description:
        "Array and object subscript access are not type-safe in TypeScript.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric:
        "This subscript access is not type-safe in TypeScript.",
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

        const numberIndexType = type.getNumberIndexType();
        // eslint-disable-next-line functional/no-conditional-statement
        if (numberIndexType !== undefined) {
          const typeParts = numberIndexType.isUnion()
            ? numberIndexType.types
            : [numberIndexType];
          // eslint-disable-next-line functional/no-conditional-statement
          if (typeParts.some((t) => t.flags & ts.TypeFlags.Undefined)) {
            // Allow subscript access if undefined is already in the array type.
            return;
          }
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          isTupleTypeReference(type) &&
          node.property.type === AST_NODE_TYPES.Literal &&
          typeof node.property.value === "number" &&
          node.property.value <= type.target.minLength
        ) {
          // Allow tuples (with or without a ...rest element) if
          // the index we're accessing is known to be safe at compile time.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          node.property.type === AST_NODE_TYPES.Literal &&
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
