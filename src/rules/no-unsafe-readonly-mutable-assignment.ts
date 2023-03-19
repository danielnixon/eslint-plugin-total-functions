/* eslint-disable functional/prefer-immutable-types */
import { getTypeImmutability, Immutability } from "is-immutable-type";
import { unionTypeParts } from "tsutils";
import { TypeChecker, Type } from "typescript";
import { createRule } from "./common";
import { createNoUnsafeAssignmentRule } from "./unsafe-assignment-rule";

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
        "Returning a readonly type from a function that is declared to return a mutable type can lead to unexpected mutation in the readonly value.",
    },
    schema: [],
  },
  create: createNoUnsafeAssignmentRule(
    (checker: TypeChecker, destinationType: Type, sourceType: Type) => {
      // eslint-disable-next-line functional/no-conditional-statements
      if (
        destinationType === sourceType ||
        unionTypeParts(destinationType).some((t) => t === sourceType)
      ) {
        // not unsafe
        return false;
      }

      const destinationImmutability = getTypeImmutability(
        checker,
        destinationType
      );
      const sourceImmutability = getTypeImmutability(checker, sourceType);

      return (
        (destinationImmutability === Immutability.ReadonlyShallow ||
          destinationImmutability === Immutability.Mutable) &&
        (sourceImmutability === Immutability.Immutable ||
          sourceImmutability === Immutability.ReadonlyDeep)
      );
    }
  ),
  defaultOptions: [],
} as const);

export default noUnsafeReadonlyMutableAssignment;
