import { isObjectType, unionTypeParts } from "tsutils";
import { Type, TypeChecker as RawTypeChecker } from "typescript";

export type TypeChecker = RawTypeChecker & {
  readonly isTypeAssignableTo?: (type1: Type, type2: Type) => boolean;
};

/**
 * Throws away non-object types (string, number, boolean, etc) because we don't check those for readonly -> mutable assignment
 * and returns an array of pairs of types that are assignable.
 */
export const assignableObjectPairs = (
  rawDestinationType: Type,
  rawSourceType: Type,
  checker: TypeChecker
): ReadonlyArray<{
  readonly destinationType: Type;
  readonly sourceType: Type;
}> => {
  const isAssignableTo = checker.isTypeAssignableTo;
  // eslint-disable-next-line functional/no-conditional-statement
  if (isAssignableTo === undefined) {
    return [];
  }

  const destinationTypeParts: readonly Type[] = unionTypeParts(
    rawDestinationType
  ).filter((t) => isObjectType(t));

  const sourceTypeParts: readonly Type[] = unionTypeParts(
    rawSourceType
  ).filter((t) => isObjectType(t));

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
