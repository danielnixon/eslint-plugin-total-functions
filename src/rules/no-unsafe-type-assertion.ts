import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils";

/**
 * An ESLint rule to ban unsafe type assertions.
 */
const noUnsafeTypeAssertion: RuleModule<
  "errorStringGeneric" | "errorStringPreferAs",
  readonly []
> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Bans unsafe type assertions.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric: "This type assertion is not type-safe.",
      errorStringPreferAs: "Use the 'as' syntax for type assertions.",
    },
    schema: [],
  },
  create: (context) => {
    return {
      // eslint-disable-next-line functional/no-return-void
      TSTypeAssertion: (node): void => {
        // This is the deprecated style so always error.

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringPreferAs",
        });
      },
      // eslint-disable-next-line functional/no-return-void
      TSAsExpression: (node): void => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (node.typeAnnotation.type === AST_NODE_TYPES.TSAnyKeyword) {
          // Always allow `as any`. Other rules will catch it.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (node.typeAnnotation.type === AST_NODE_TYPES.TSUnknownKeyword) {
          // Always allow `as unknown`.
          return;
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (
          node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
          node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
          node.typeAnnotation.typeName.name === "const"
        ) {
          // Always allow `as const`.
          return;
        }

        // TODO allow safe type assertions.

        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        });
      },
    };
  },
};

export default noUnsafeTypeAssertion;
