import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { ESLintUtils } from "@typescript-eslint/experimental-utils";

/**
 * An ESLint rule to enforce TypeScript strict mode.
 */
const requireStrictMode: RuleModule<"errorStringGeneric", readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Enforces the use of TypeScript's strict mode.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringGeneric: "TypeScript's strict mode is required.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);

    return {
      Program: (node) => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (parserServices.program.getCompilerOptions().strict !== true) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringGeneric",
          });
        }
      },
    };
  },
};

export default requireStrictMode;
