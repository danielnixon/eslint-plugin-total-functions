import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  // eslint-disable-next-line functional/functional-parameters
  () => "https://github.com/danielnixon/eslint-plugin-total-functions"
);
