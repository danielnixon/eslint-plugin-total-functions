/* eslint-disable functional/type-declaration-immutability */
/* eslint-disable functional/prefer-immutable-types */

import { Type } from "typescript";
import { typeSymbolName } from "./common";

// Note: `Lazy` deliberately excluded even though it has the same signature as `IO`, its semantics
// don't imply impurity like IO.
export const effects: readonly string[] = [
  "IO",
  "IOEither",
  "IOOption",
  "ReaderTask",
  "ReaderTaskEither",
  "StateReaderTaskEither",
  "Task",
  "TaskEither",
  "TaskOption",
  "TaskThese",
] as const;

export type FpTsEffectType = {
  readonly effectType: Type;
  readonly effectName: string;
  readonly effectTypeParameter: Type | undefined;
};

const fpTsEffectTypeParameter = (
  effectName: string,
  effectType: Type
): Type | undefined => {
  // eslint-disable-next-line functional/no-conditional-statements
  if (effectName === "IO") {
    const signatures = effectType.getCallSignatures();
    const signature = signatures[0];

    // eslint-disable-next-line functional/no-conditional-statements
    if (signatures.length !== 1 || signature === undefined) {
      return undefined;
    }

    return signature.getReturnType();
  }

  // TODO extract the type param from other effect types.
  return undefined;
};

export const fpTsEffectType = (type: Type): FpTsEffectType | undefined => {
  const symbolName = typeSymbolName(type);

  // eslint-disable-next-line functional/no-conditional-statements
  if (symbolName === undefined || !effects.includes(symbolName)) {
    return undefined;
  }

  return {
    effectType: type,
    effectName: symbolName,
    effectTypeParameter: fpTsEffectTypeParameter(symbolName, type),
  } as const;
};
