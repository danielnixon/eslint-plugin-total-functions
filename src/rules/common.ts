/* eslint-disable functional/prefer-immutable-types */
import { ESLintUtils } from "@typescript-eslint/utils";
import { unionTypeParts } from "tsutils";
import { Type, TypeChecker } from "typescript";

export const createRule = ESLintUtils.RuleCreator(
  // eslint-disable-next-line functional/functional-parameters
  () => "https://github.com/danielnixon/eslint-plugin-total-functions"
);

// eslint-disable-next-line functional/type-declaration-immutability
export type TypePair = {
  readonly destinationType: Type;
  readonly sourceType: Type;
};

/**
 * Breaks the supplied types into their union type parts and returns an
 * array of pairs of constituent types that are assignable.
 */
export const assignableTypePairs = (
  rawDestinationType: Type,
  rawSourceType: Type,
  checker: TypeChecker
): readonly TypePair[] => {
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  const destinationTypeParts: readonly Type[] =
    unionTypeParts(rawDestinationType);

  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  const sourceTypeParts: readonly Type[] = unionTypeParts(rawSourceType);

  return sourceTypeParts.flatMap((sourceTypePart) =>
    destinationTypeParts
      .filter((destinationTypePart) =>
        checker.isTypeAssignableTo(sourceTypePart, destinationTypePart)
      )
      .map((destinationTypePart) => ({
        sourceType: sourceTypePart,
        destinationType: destinationTypePart,
      }))
  );
};
