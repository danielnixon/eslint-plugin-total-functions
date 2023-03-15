/* eslint-disable functional/type-declaration-immutability */
/* eslint-disable functional/prefer-immutable-types */

import { Type } from "typescript";
import { typeSymbolName } from "./common";

// Note: `Lazy` deliberately excluded even though it has the same signature as `IO`, its semantics
// don't imply impurity like IO.
export const synchronousEffects: readonly string[] = [
  "IO",
  "IOEither",
  "IOOption",
] as const;

export const asynchronousEffects: readonly string[] = [
  "ReaderTask",
  "ReaderTaskEither",
  "StateReaderTaskEither",
  "Task",
  "TaskEither",
  "TaskOption",
  "TaskThese",
] as const;

export const allEffects: readonly string[] =
  synchronousEffects.concat(asynchronousEffects);

export type FpTsEffectType = {
  readonly effectType: Type;
  readonly typeParameter: Type;
};

export const fpTsEffectType = (type: Type): FpTsEffectType | undefined => {
  const symbolName = typeSymbolName(type);

  // eslint-disable-next-line functional/no-conditional-statements
  if (symbolName === undefined || !allEffects.includes(symbolName)) {
    return undefined;
  }

  const signatures = type.getCallSignatures();
  const signature = signatures[0];

  // eslint-disable-next-line functional/no-conditional-statements
  if (signatures.length !== 1 || signature === undefined) {
    return undefined;
  }

  return {
    effectType: type,
    typeParameter: signature.getReturnType(),
  } as const;
};
