import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { ESLintUtils } from "@typescript-eslint/experimental-utils";

/**
 * An ESLint rule to enforce TypeScript strict mode.
 */
const requireStrictMode: RuleModule<
  | "strict"
  | "noUncheckedIndexedAccess"
  | "useUnknownInCatchVariables"
  | "strictFunctionTypes"
  | "strictBindCallApply"
  | "strictNullChecks"
  | "strictPropertyInitialization",
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
      strict: "TypeScript's strict mode is required.",
      noUncheckedIndexedAccess:
        "TypeScript's noUncheckedIndexedAccess mode is required.",
      useUnknownInCatchVariables:
        "TypeScript's useUnknownInCatchVariables mode is required.",
      strictFunctionTypes:
        "Do not disable the strictFunctionTypes compiler option.",
      strictBindCallApply:
        "Do not disable the strictBindCallApply compiler option.",
      strictNullChecks: "Do not disable the strictNullChecks compiler option.",
      strictPropertyInitialization:
        "Do not disable the strictPropertyInitialization compiler option.",
    },
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const options = parserServices.program.getCompilerOptions();

    return {
      Program: (node) => {
        const mustBeEnabled = ["strict", "noUncheckedIndexedAccess", "useUnknownInCatchVariables"] as const;
        const mustNotBeDisabled = [
          "strictFunctionTypes",
          "strictBindCallApply",
          "strictNullChecks",
          "strictPropertyInitialization",
        ] as const;

        // eslint-disable-next-line functional/no-expression-statement
        mustBeEnabled.forEach((option) => {
          // eslint-disable-next-line functional/no-conditional-statement
          if (options[option] !== true) {
            // eslint-disable-next-line functional/no-expression-statement
            context.report({
              node: node,
              messageId: option,
            } as const);
          }
        });

        // eslint-disable-next-line functional/no-expression-statement
        mustNotBeDisabled.forEach((option) => {
          // eslint-disable-next-line functional/no-conditional-statement
          if (options[option] === false) {
            // eslint-disable-next-line functional/no-expression-statement
            context.report({
              node: node,
              messageId: option,
            } as const);
          }
        });
      },
    };
  },
};

export default requireStrictMode;
