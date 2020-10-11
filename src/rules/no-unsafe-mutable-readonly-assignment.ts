import { RuleModule } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { isPropertyReadonlyInType } from "tsutils";
import { Type, Symbol, IndexKind, TypeChecker } from "typescript";
import {
  createNoUnsafeAssignmentRule,
  MessageId,
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

  // eslint-disable-next-line functional/no-conditional-statement
  if (destinationIndexInfo === undefined) {
    return false;
  }

  // eslint-disable-next-line functional/no-conditional-statement
  if (sourceIndexInfo === undefined) {
    return false;
  }

  const destinationTypeHasReadonlyIndexSignature =
    destinationIndexInfo.isReadonly;
  const sourceTypeHasReadonlyIndexSignature = sourceIndexInfo.isReadonly;

  return (
    !sourceTypeHasReadonlyIndexSignature &&
    destinationTypeHasReadonlyIndexSignature
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
  // eslint-disable-next-line functional/no-conditional-statement
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

  return !sourcePropIsReadonly && destinationPropIsReadonly;
};

/**
 * An ESLint rule to ban unsafe assignment from mutable to readonly types.
 */
const noUnsafeMutableReadonlyAssignment: RuleModule<MessageId, readonly []> = {
  meta: {
    type: "problem",
    docs: {
      category: "Possible Errors",
      description: "Bans unsafe assignment from mutable to readonly types.",
      recommended: "error",
      url: "https://github.com/danielnixon/eslint-plugin-total-functions",
    },
    messages: {
      errorStringCallExpression:
        "Passing a mutable type to a function that expects a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringAssignmentExpression:
        "Assigning a mutable type to a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringVariableDeclaration:
        "Using a mutable type to initialize a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringArrowFunctionExpression:
        "Returning a mutable type from a function that returns a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringTSAsExpression:
        "Asserting a mutable type to a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringTSTypeAssertion:
        "Asserting a mutable type to a readonly type can lead to unexpected mutation in the readonly value.",
    },
    schema: [],
  },
  create: createNoUnsafeAssignmentRule(
    unsafePropertyAssignmentFunc,
    unsafeIndexAssignmentFunc
  ),
};

export default noUnsafeMutableReadonlyAssignment;
