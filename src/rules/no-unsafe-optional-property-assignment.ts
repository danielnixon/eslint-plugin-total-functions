import { createRule } from "./common";

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
    messages: {},
    schema: [],
    deprecated: true,
  },
  // eslint-disable-next-line functional/functional-parameters
  create: () => ({}),
  defaultOptions: [],
} as const);

export default noUnsafeOptionalPropertyAssignment;
