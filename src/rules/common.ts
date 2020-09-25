import { intersectionTypeParts, isObjectType, unionTypeParts } from "tsutils";
import { Type, TypeChecker as RawTypeChecker } from "typescript";

export type TypeChecker = RawTypeChecker & {
  readonly isTypeAssignableTo?: (type1: Type, type2: Type) => boolean;
};

export type TypePairArray = ReadonlyArray<{
  readonly destinationType: Type;
  readonly sourceType: Type;
}>;

/**
 * Throws away non-object types (string, number, boolean, etc) because we don't check those for readonly -> mutable assignment
 * and returns an array of pairs of types that are assignable.
 */
export const assignableObjectPairs = (
  rawDestinationType: Type,
  rawSourceType: Type,
  checker: TypeChecker
): TypePairArray => {
  const isAssignableTo = checker.isTypeAssignableTo;
  // eslint-disable-next-line functional/no-conditional-statement
  if (isAssignableTo === undefined) {
    return [] as const;
  }

  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  const destinationTypeParts: readonly Type[] = unionTypeParts(
    rawDestinationType
  ).filter((t) => intersectionTypeParts(t).every((itp) => isObjectType(itp)));

  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  const sourceTypeParts: readonly Type[] = unionTypeParts(
    rawSourceType
  ).filter((t) => intersectionTypeParts(t).every((itp) => isObjectType(itp)));

  // TODO https://github.com/danielnixon/eslint-plugin-total-functions/issues/100
  // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
  return sourceTypeParts.flatMap((sourceTypePart) =>
    destinationTypeParts
      .filter((destinationTypePart) =>
        isAssignableTo(sourceTypePart, destinationTypePart)
      )
      .map((destinationTypePart) => ({
        sourceType: sourceTypePart,
        destinationType: destinationTypePart,
      }))
  );
};
