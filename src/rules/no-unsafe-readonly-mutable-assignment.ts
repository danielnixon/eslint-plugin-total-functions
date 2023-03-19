/* eslint-disable functional/prefer-immutable-types */
import {
  isTypeAnyType,
  isTypeUnknownType,
} from "@typescript-eslint/type-utils";
import {
  getDefaultOverrides,
  getTypeImmutability,
  Immutability,
} from "is-immutable-type";
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

        // eslint-disable-next-line functional/no-conditional-statements
        if (
          isTypeUnknownType(sourceType) ||
          isTypeUnknownType(destinationType)
        ) {
          // not unsafe
          return false;
        }

        // TODO support config
        const overrides = getDefaultOverrides();

        const destinationImmutability = getTypeImmutability(
          checker,
          destinationType,
          overrides
        );
        const sourceImmutability = getTypeImmutability(
          checker,
          sourceType,
          overrides
        );

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
