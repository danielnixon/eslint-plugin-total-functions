import { isObjectType, unionTypeParts } from "tsutils";
import { get } from "total-functions";
import { Type, TypeChecker, Symbol } from "typescript";

/**
 * Throws away non-object types (string, number, boolean, etc) because we don't check those for readonly -> mutable assignment.
 */
export const filterTypes = (
  rawDestinationType: Type,
  rawSourceType: Type
): {
  readonly destinationType: Type | undefined;
  readonly sourceType: Type | undefined;
} => {
  // TODO if the destination is a union containing _all_ mutable types, we're assigning to mutable.
  // TODO if the destination contains a mix of mutable and readonly types, we don't know if we're assigning
  // to mutable unless we can narrow down which destination (parameter) types apply to the given source (argument) types.
  // TODO if the sourceType is a union containing _any_ readonly types, we're assigning from readonly.

  const filteredDestinationTypes = unionTypeParts(
    rawDestinationType
  ).filter((t) => isObjectType(t));
  const destinationType =
    filteredDestinationTypes.length === 1
      ? get(filteredDestinationTypes, 0)
      : undefined;

  const filteredSourceTypes = unionTypeParts(rawSourceType).filter((t) =>
    isObjectType(t)
  );
  const sourceType =
    filteredSourceTypes.length === 1 ? get(filteredSourceTypes, 0) : undefined;

  return {
    destinationType,
    sourceType,
  };
};

export const symbolToType = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  s: Symbol,
  checker: TypeChecker
): Type | undefined => {
  const declarations = s.getDeclarations() || [];
  // TODO: How to choose declaration when there are multiple?
  const declaration =
    declarations.length > 1 ? undefined : get(declarations, 0);
  return declaration !== undefined
    ? checker.getTypeAtLocation(declaration)
    : undefined;
};
