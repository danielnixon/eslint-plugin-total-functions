/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils } from "@typescript-eslint/utils";
import { CompilerOptions } from "typescript";
import { createRule } from "./common";

const messages = {
  strict: "TypeScript's strict mode is required.",
  noUncheckedIndexedAccess:
    "TypeScript's noUncheckedIndexedAccess mode is required.",
  useUnknownInCatchVariables:
    "Do not disable the useUnknownInCatchVariables compiler option.",
  strictFunctionTypes:
    "Do not disable the strictFunctionTypes compiler option.",
  strictBindCallApply:
    "Do not disable the strictBindCallApply compiler option.",
  strictNullChecks: "Do not disable the strictNullChecks compiler option.",
  strictPropertyInitialization:
    "Do not disable the strictPropertyInitialization compiler option.",
};

type CompilerOption = keyof CompilerOptions & keyof typeof messages;

/**
 * An ESLint rule to enforce TypeScript strict mode.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const requireStrictMode = createRule({
  name: "require-strict-mode",
  meta: {
    type: "problem",
    docs: {
      description: "Enforces the use of TypeScript's strict mode.",
      recommended: "error",
    },
    messages: messages,
    schema: [],
  },
  create: (context) => {
    const parserServices = ESLintUtils.getParserServices(context);
    const options = parserServices.program.getCompilerOptions();

    return {
      // eslint-disable-next-line functional/no-return-void
      Program: (node) => {
        const mustBeEnabled: readonly CompilerOption[] = [
          "strict",
          "noUncheckedIndexedAccess",
        ] as const;
        const mustNotBeDisabled: readonly CompilerOption[] = [
          "strictFunctionTypes",
          "strictBindCallApply",
          "strictNullChecks",
          "strictPropertyInitialization",
          "useUnknownInCatchVariables",
        ] as const;

        // eslint-disable-next-line functional/no-expression-statements, functional/no-return-void
        mustBeEnabled.forEach((option) => {
          // eslint-disable-next-line functional/no-conditional-statements
          if (options[option] !== true) {
            // eslint-disable-next-line functional/no-expression-statements
            context.report({
              node: node,
              messageId: option,
            } as const);
          }
        });

        // eslint-disable-next-line functional/no-expression-statements, functional/no-return-void
        mustNotBeDisabled.forEach((option) => {
          // eslint-disable-next-line functional/no-conditional-statements
          if (options[option] === false) {
            // eslint-disable-next-line functional/no-expression-statements
            context.report({
              node: node,
              messageId: option,
            } as const);
          }
        });
      },
    };
  },
  defaultOptions: [],
} as const);

export default requireStrictMode;
