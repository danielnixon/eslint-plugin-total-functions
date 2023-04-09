/* eslint-disable functional/prefer-immutable-types */
import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from "@typescript-eslint/utils";
import { unionTypeParts } from "tsutils";
import { Type, TypeChecker } from "typescript";

export const createRule = ESLintUtils.RuleCreator(
  // eslint-disable-next-line functional/functional-parameters
  () => "https://github.com/danielnixon/eslint-plugin-total-functions"
);

export const typeSymbolName = (type: Type): string | undefined => {
  // eslint-disable-next-line functional/no-try-statements
  try {
    // HACK despite what the type suggests, symbol can in fact be undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return type?.symbol?.name;
  } catch {
    // Accessing symbol can throw for reasons I don't fully understand.
    return undefined;
  }
};

// eslint-disable-next-line functional/type-declaration-immutability
export type TypePair = {
  readonly destinationType: Type;
  readonly sourceType: Type;
};

/**
 * Breaks the supplied types into their union type parts and returns an
 * array of pairs of constituent types that are assignable.
 */
export const assignableTypePairs = (
  rawDestinationType: Type,
  rawSourceType: Type,
  checker: TypeChecker
): readonly TypePair[] => {
  const destinationTypeParts = unionTypeParts(rawDestinationType);

  const sourceTypeParts = unionTypeParts(rawSourceType);

  return sourceTypeParts.flatMap((sourceTypePart) =>
    destinationTypeParts
      .filter((destinationTypePart) =>
        checker.isTypeAssignableTo(sourceTypePart, destinationTypePart)
      )
      .map(
        (destinationTypePart) =>
          ({
            sourceType: sourceTypePart,
            destinationType: destinationTypePart,
          } as const)
      )
  );
};

/**
 * True if this expression is a literal, false otherwise.
 */
export const isLiteral = (sourceNode: TSESTree.Expression | undefined) => {
  // eslint-disable-next-line functional/no-conditional-statements
  if (sourceNode === undefined) {
    return false;
  }

  // eslint-disable-next-line functional/no-conditional-statements
  if (sourceNode.type === AST_NODE_TYPES.ObjectExpression) {
    // empty object literal: {}
    return sourceNode.properties.length === 0;
  }

  // eslint-disable-next-line functional/no-conditional-statements
  if (sourceNode.type === AST_NODE_TYPES.ArrayExpression) {
    // empty object literal: []
    return sourceNode.elements.length === 0;
  }

  // TODO: handle recursive case for both arrays and objects and
  // permit literals such as string and numbers as properties

  return false;
};
