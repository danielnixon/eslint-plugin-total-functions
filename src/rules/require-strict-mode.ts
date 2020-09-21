import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { ESLintUtils } from "@typescript-eslint/experimental-utils";

/**
 * An ESLint rule to enforce TypeScript strict mode.
 */
const requireStrictMode: RuleModule<
  "errorStringStrictMode" | "errorStringNoUncheckedIndexedAccess",
  readonly []
> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Enforces the use of TypeScript's strict mode.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringStrictMode: "TypeScript's strict mode is required.",
      errorStringNoUncheckedIndexedAccess:
        "TypeScript's noUncheckedIndexedAccess mode is required.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const options = parserServices.program.getCompilerOptions();

    return {
      Program: (node) => {
        // eslint-disable-next-line functional/no-conditional-statement
        if (options.strict !== true) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringStrictMode",
          });
        }

        // eslint-disable-next-line functional/no-conditional-statement
        if (options.noUncheckedIndexedAccess !== true) {
          // eslint-disable-next-line functional/no-expression-statement
          context.report({
            node: node,
            messageId: "errorStringNoUncheckedIndexedAccess",
          });
        }
      },
    };
  },
};

export default requireStrictMode;
