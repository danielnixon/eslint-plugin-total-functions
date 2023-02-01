import { isSymbolFlagSet } from "tsutils";
import { Symbol, SymbolFlags } from "typescript";
import { createRule } from "./common";
import {
  createNoUnsafeAssignmentRule,
  UnsafeIndexAssignmentFunc,
  UnsafePropertyAssignmentFunc,
} from "./unsafe-assignment-rule";

// eslint-disable-next-line functional/functional-parameters
const unsafeIndexAssignmentFunc: UnsafeIndexAssignmentFunc = (): boolean =>
  false;

const unsafePropertyAssignmentFunc: UnsafePropertyAssignmentFunc = (
  // eslint-disable-next-line functional/prefer-immutable-types, @typescript-eslint/ban-types
  destinationProperty: Symbol,
  // eslint-disable-next-line functional/prefer-immutable-types, @typescript-eslint/ban-types
  sourceProperty: Symbol | undefined
): boolean => {
  const destinationPropIsOptional = isSymbolFlagSet(
    destinationProperty,
    SymbolFlags.Optional
  );

  return destinationPropIsOptional && sourceProperty === undefined;
};

const message =
  "Assigning to an optional property when there is no such property in the source type (optional or otherwise) is unsafe.";

/**
 * An ESLint rule to ban unsafe assignment to optional properties.
 */
// eslint-disable-next-line functional/prefer-immutable-types, total-functions/no-unsafe-readonly-mutable-assignment
const noUnsafeOptionalPropertyAssignment = createRule({
  name: "no-unsafe-readonly-mutable-assignment",
  meta: {
    type: "problem",
    docs: {
      description: "Bans unsafe assignment to optional properties.",
      recommended: "error",
    },
    messages: {
      errorStringCallExpression: message,
      errorStringAssignmentExpression: message,
      errorStringVariableDeclaration: message,
      errorStringArrowFunctionExpression: message,
      errorStringTSAsExpression: message,
      errorStringTSTypeAssertion: message,
    },
    schema: [],
  },
  create: createNoUnsafeAssignmentRule(
    unsafePropertyAssignmentFunc,
    unsafeIndexAssignmentFunc
  ),
  defaultOptions: [],
} as const);

export default noUnsafeOptionalPropertyAssignment;
