import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";

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
  create: (context) => ({
    // eslint-disable-next-line functional/no-return-void
    MemberExpression: (node): void => {
      // TODO leverage type information here.
      // https://github.com/typescript-eslint/typescript-eslint#can-we-write-rules-which-leverage-type-information
      // eslint-disable-next-line functional/no-conditional-statement
      if (node.computed) {
        // eslint-disable-next-line functional/no-expression-statement
        context.report({
          node: node,
          messageId: "errorStringGeneric",
        });
      }
    },
  }),
};

export default noArraySubscript;
