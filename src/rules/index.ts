import noUnsafeSubscript from "./no-unsafe-subscript";
import noUnsafeDestructuring from "./no-unsafe-destructuring";
import noUnsafeTypeAssertion from "./no-unsafe-type-assertion";
import noUnsafeReadonlyMutableAssignment from "./no-unsafe-readonly-mutable-assignment";
import noUnsafeMutableReadonlyAssignment from "./no-unsafe-mutable-readonly-assignment";
import noUnsafeOptionalPropertyAssignment from "./no-unsafe-optional-property-assignment";
import requireStrictMode from "./require-strict-mode";

export default {
  "require-strict-mode": requireStrictMode,
  "no-unsafe-type-assertion": noUnsafeTypeAssertion,
  "no-unsafe-readonly-mutable-assignment": noUnsafeReadonlyMutableAssignment,
  "no-unsafe-mutable-readonly-assignment": noUnsafeMutableReadonlyAssignment,
  // Retained for backward compatibility.
  "no-unsafe-assignment": noUnsafeReadonlyMutableAssignment,
  "no-unsafe-optional-property-assignment": noUnsafeOptionalPropertyAssignment,
  "no-unsafe-subscript": noUnsafeSubscript,
  "no-unsafe-destructuring": noUnsafeDestructuring,
};
