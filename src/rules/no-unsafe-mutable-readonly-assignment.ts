/* eslint-disable functional/prefer-immutable-types */
import { isTypeAnyType } from "@typescript-eslint/type-utils";
import { getTypeImmutability, Immutability } from "is-immutable-type";
import { Type, TypeChecker } from "typescript";
import { assignableTypePairs, createRule } from "./common";
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
      errorStringGeneric:
        'Unsafe "{{ sourceImmutability }}" to "{{ destinationImmutability }}" assignment. Source: "{{ sourceType }}", destination: "{{ destinationType }}"',
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
        // eslint-disable-next-line functional/no-conditional-statements
        if (sourceType === destinationType) {
          // not unsafe
          return false;
        }

        // eslint-disable-next-line functional/no-conditional-statements
        if (isTypeAnyType(sourceType) || isTypeAnyType(destinationType)) {
          // not unsafe
          return false;
        }

        const destinationImmutability = getTypeImmutability(
          checker,
          destinationType
        );
        const sourceImmutability = getTypeImmutability(checker, sourceType);

        return (
          (destinationImmutability === Immutability.Immutable ||
            destinationImmutability === Immutability.ReadonlyDeep) &&
          (sourceImmutability === Immutability.ReadonlyShallow ||
            sourceImmutability === Immutability.Mutable)
        );
      });
    }
  ),
  defaultOptions: [],
} as const);

export default noUnsafeMutableReadonlyAssignment;
