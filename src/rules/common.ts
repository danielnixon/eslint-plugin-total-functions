import { Type, TypeChecker as RawTypeChecker } from "typescript";

export type TypeChecker = RawTypeChecker & {
  readonly isTypeAssignableTo?: (type1: Type, type2: Type) => boolean;
};

export type TypePairArray = ReadonlyArray<{
  readonly destinationType: Type;
  readonly sourceType: Type;
}>;
