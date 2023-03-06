import "typescript";

declare module "typescript" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, functional/type-declaration-immutability
  interface TypeChecker {
    readonly isArrayType: (type: Type) => type is TypeReference;
    // eslint-disable-next-line functional/prefer-immutable-types
    readonly isTypeAssignableTo: (type1: Type, type2: Type) => boolean;
  }
}
