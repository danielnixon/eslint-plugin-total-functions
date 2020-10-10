/* eslint-disable functional/no-method-signature */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable functional/prefer-type-literal */
import "typescript";

declare module "typescript" {
  interface TypeChecker {
    isArrayType(type: Type): type is TypeReference;
    isTypeAssignableTo(type1: Type, type2: Type): boolean;
  }
}
