/* eslint-disable functional/prefer-immutable-types */
import { getTypeImmutability, Immutability } from "is-immutable-type";
import { Type, TypeChecker } from "typescript";
import { createRule } from "./common";
import { createNoUnsafeAssignmentRule } from "./unsafe-assignment-rule";

/**
 * An ESLint rule to ban unsafe assignment from mutable to readonly types.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noUnsafeMutableReadonlyAssignment = createRule({
  name: "no-unsafe-mutable-readonly-assignment",
  meta: {
    type: "problem",
    docs: {
      description: "Bans unsafe assignment from mutable to readonly types.",
      recommended: "error",
    },
    messages: {
      errorStringCallExpression:
        "Passing a mutable type to a function that expects a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringAssignmentExpression:
        "Assigning a mutable type to a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringVariableDeclaration:
        "Using a mutable type to initialize a readonly type can lead to unexpected mutation in the readonly value.",
      errorStringArrowFunctionExpression:
        "Returning a mutable type from a function that is declared to return a readonly type can lead to unexpected mutation in the readonly value.",
    },
    schema: [],
  },
  create: createNoUnsafeAssignmentRule(
    (checker: TypeChecker, destinationType: Type, sourceType: Type) => {
      const destinationImmutability = getTypeImmutability(
        checker,
        // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
        destinationType
      );
      // eslint-disable-next-line total-functions/no-unsafe-mutable-readonly-assignment
      const sourceImmutability = getTypeImmutability(checker, sourceType);

      return (
        (destinationImmutability === Immutability.Immutable ||
          destinationImmutability === Immutability.ReadonlyDeep) &&
        (sourceImmutability === Immutability.ReadonlyShallow ||
          sourceImmutability === Immutability.Mutable)
      );
    }
  ),
  defaultOptions: [],
} as const);

export default noUnsafeMutableReadonlyAssignment;
