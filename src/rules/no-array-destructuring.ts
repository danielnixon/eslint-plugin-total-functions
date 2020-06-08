import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";

/**
 * An ESLint rule to ban array destructuring, which is not well-typed in TypeScript.
 */
const noArrayDestructuring: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors" as const,
      description: "Array destructuring is not type-safe in TypeScript.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric: "Array destructuring is not type-safe in TypeScript.",
    },
    schema: [],
  },
  create: (context) => ({
    // eslint-disable-next-line functional/no-return-void
    ArrayPattern: (node): void => {
      // TODO leverage type information here.
      // https://github.com/typescript-eslint/typescript-eslint#can-we-write-rules-which-leverage-type-information

      // eslint-disable-next-line functional/no-expression-statement
      context.report({
        node: node,
        messageId: "errorStringGeneric",
      });
    },
  }),
};

export default noArrayDestructuring;
