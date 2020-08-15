import { isObjectType, unionTypeParts } from "tsutils";
import { get } from "total-functions";
import { Type, TypeChecker as RawTypeChecker, Symbol } from "typescript";

export type TypeChecker = RawTypeChecker & {
  readonly isTypeAssignableTo?: (type1: Type, type2: Type) => boolean;
};

export const single = <A>(as: ReadonlyArray<A>): A | undefined =>
  as.length === 1 ? get(as, 0) : undefined;

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

  const destinationTypeParts = unionTypeParts(rawDestinationType).filter((t) =>
    isObjectType(t)
  );

  const sourceTypeParts = unionTypeParts(rawSourceType).filter((t) =>
    isObjectType(t)
  );

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

export const symbolToType = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  s: Symbol,
  checker: TypeChecker
): Type | undefined => {
  const declarations = s.getDeclarations() || [];
  // TODO: How to choose declaration when there are multiple?
  const declaration = single(declarations);
  return declaration !== undefined
    ? checker.getTypeAtLocation(declaration)
    : undefined;
};
