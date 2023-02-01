/* eslint-disable functional/prefer-immutable-types */
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable functional/type-declaration-immutability */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import "typescript";

declare module "typescript" {
  interface TypeChecker {
    isArrayType(type: Type): type is TypeReference;
    isTypeAssignableTo(type1: Type, type2: Type): boolean;
  }
}
