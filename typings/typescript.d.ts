/* eslint-disable functional/prefer-immutable-types */
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable functional/type-declaration-immutability */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import "typescript";

declare module "typescript" {
  interface TypeChecker {
    // https://github.com/typescript-eslint/typescript-eslint/blob/09c04fb0d5a5dee0dc266abb2e21aa9a1c489712/packages/type-utils/typings/typescript.d.ts#L7-L14
    isArrayType(type: Type): type is TypeReference;
    // https://github.com/Microsoft/TypeScript/issues/11728
    // https://github.com/microsoft/TypeScript/issues/9879
    isTypeAssignableTo(type1: Type, type2: Type): boolean;
  }
}
