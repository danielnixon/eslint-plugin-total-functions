/* eslint-disable functional/prefer-immutable-types */
import { createRule } from "./common";

/**
 * An ESLint rule to ban unsafe enum assignments.
 */
// eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
const noUnsafeEnumAssignment = createRule({
  name: "no-unsafe-enum-assignment",
  meta: {
    type: "problem",
    docs: {
      description: "Bans unsafe enum assignment.",
      recommended: "error",
    },
    messages: {},
    schema: [],
    deprecated: true,
  },
  // eslint-disable-next-line functional/functional-parameters
  create: () => ({}),
  defaultOptions: [],
} as const);

export default noUnsafeEnumAssignment;
