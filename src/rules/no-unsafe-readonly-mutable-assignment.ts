/* eslint-disable functional/prefer-immutable-types */
import { getTypeImmutability, Immutability } from "is-immutable-type";
import { TypeChecker, Type } from "typescript";
import { assignableTypePairs, createRule } from "./common";
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
      errorStringGeneric:
        'Unsafe readonly to mutable assignment. Source: "{{ source }}", destination: "{{ destination }}"',
    },
    schema: [],
  },
  create: createNoUnsafeAssignmentRule(
    (checker: TypeChecker, rawDestinationType: Type, rawSourceType: Type) => {
      const typePairs = assignableTypePairs(
        rawDestinationType,
        rawSourceType,
        checker
      );

      return typePairs.some(({ sourceType, destinationType }) => {
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
      });
    }
  ),
  defaultOptions: [],
} as const);

export default noUnsafeReadonlyMutableAssignment;
