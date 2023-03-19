/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils } from "@typescript-eslint/utils";
import { Type } from "typescript";

export const createRule = ESLintUtils.RuleCreator(
  // eslint-disable-next-line functional/functional-parameters
  () => "https://github.com/danielnixon/eslint-plugin-total-functions"
);

export const typeSymbolName = (type: Type): string | undefined => {
  // eslint-disable-next-line functional/no-try-statements
  try {
    // HACK despite what the type suggests, symbol can in fact be undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return type?.symbol?.name;
  } catch {
    // Accessing symbol can throw for reasons I don't fully understand.
    return undefined;
  }
};
