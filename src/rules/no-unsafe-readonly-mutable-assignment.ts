/* eslint-disable functional/prefer-immutable-types */
import { isPropertyReadonlyInType } from "tsutils";
import { Type, Symbol, IndexKind, TypeChecker } from "typescript";
import { createRule } from "./common";
import {
  createNoUnsafeAssignmentRule,
  UnsafeIndexAssignmentFunc,
  UnsafePropertyAssignmentFunc,
} from "./unsafe-assignment-rule";

const unsafeIndexAssignmentFunc: UnsafeIndexAssignmentFunc = (
  indexKind: IndexKind,
  destinationType: Type,
  sourceType: Type,
  checker: TypeChecker
): boolean => {
  const destinationIndexInfo = checker.getIndexInfoOfType(
    destinationType,
    indexKind
  );
  const sourceIndexInfo = checker.getIndexInfoOfType(sourceType, indexKind);

  // eslint-disable-next-line functional/no-conditional-statements
  if (destinationIndexInfo === undefined) {
    return false;
  }

  // eslint-disable-next-line functional/no-conditional-statements
  if (sourceIndexInfo === undefined) {
    return false;
  }

  const destinationTypeHasReadonlyIndexSignature =
    destinationIndexInfo.isReadonly;
  const sourceTypeHasReadonlyIndexSignature = sourceIndexInfo.isReadonly;

  return (
    sourceTypeHasReadonlyIndexSignature &&
    !destinationTypeHasReadonlyIndexSignature
  );
};

const unsafePropertyAssignmentFunc: UnsafePropertyAssignmentFunc = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  destinationProperty: Symbol,
  // eslint-disable-next-line @typescript-eslint/ban-types
  sourceProperty: Symbol | undefined,
  destinationType: Type,
  sourceType: Type,
  checker: TypeChecker
): boolean => {
  // eslint-disable-next-line functional/no-conditional-statements
  if (sourceProperty === undefined) {
    return false;
  }

  const destinationPropIsReadonly = isPropertyReadonlyInType(
    destinationType,
    destinationProperty.getEscapedName(),
    checker
  );

  const sourcePropIsReadonly = isPropertyReadonlyInType(
    sourceType,
    sourceProperty.getEscapedName(),
    checker
  );

  return sourcePropIsReadonly && !destinationPropIsReadonly;
};

/**
 * An ESLint rule to ban unsafe assignment from readonly to mutable types.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noUnsafeReadonlyMutableAssignment = createRule({
  name: "no-unsafe-readonly-mutable-assignment",
  meta: {
    type: "problem",
    docs: {
      description: "Bans unsafe assignment from readonly to mutable types.",
      recommended: "error",
    },
    messages: {
      errorStringCallExpression:
        "Passing a readonly type to a function that expects a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringAssignmentExpression:
        "Assigning a readonly type to a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringVariableDeclaration:
        "Using a readonly type to initialize a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringArrowFunctionExpression:
        "Returning a readonly type from a function that returns a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringTSAsExpression:
        "Asserting a readonly type to a mutable type can lead to unexpected mutation in the readonly value.",
      errorStringTSTypeAssertion:
        "Asserting a readonly type to a mutable type can lead to unexpected mutation in the readonly value.",
    },
    schema: [],
  },
  create: createNoUnsafeAssignmentRule(
    unsafePropertyAssignmentFunc,
    unsafeIndexAssignmentFunc
  ),
  defaultOptions: [],
} as const);

export default noUnsafeReadonlyMutableAssignment;
