import { Type, TypeChecker as RawTypeChecker, TypeReference } from "typescript";

export type TypeChecker = RawTypeChecker & {
  readonly isTypeAssignableTo?: (type1: Type, type2: Type) => boolean;
  readonly isArrayType?: (type: Type) => type is TypeReference;
};

export type TypePairArray = ReadonlyArray<{
  readonly destinationType: Type;
  readonly sourceType: Type;
}>;
