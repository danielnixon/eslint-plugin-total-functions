import noUnsafeTypeAssertion from "./no-unsafe-type-assertion";
import noUnsafeReadonlyMutableAssignment from "./no-unsafe-readonly-mutable-assignment";
import noUnsafeMutableReadonlyAssignment from "./no-unsafe-mutable-readonly-assignment";
import noUnsafeOptionalPropertyAssignment from "./no-unsafe-optional-property-assignment";
import requireStrictMode from "./require-strict-mode";
import noUnsafeEnumAssignment from "./no-unsafe-enum-assignment";
import noEnums from "./no-enums";
import noPartialUrlConstructor from "./no-partial-url-constructor";
import noPartialDivision from "./no-partial-division";

export default {
  "require-strict-mode": requireStrictMode,
  "no-unsafe-type-assertion": noUnsafeTypeAssertion,
  "no-unsafe-readonly-mutable-assignment": noUnsafeReadonlyMutableAssignment,
  "no-unsafe-mutable-readonly-assignment": noUnsafeMutableReadonlyAssignment,
  "no-unsafe-optional-property-assignment": noUnsafeOptionalPropertyAssignment,
  "no-unsafe-enum-assignment": noUnsafeEnumAssignment,
  "no-enums": noEnums,
  "no-partial-url-constructor": noPartialUrlConstructor,
  "no-partial-division": noPartialDivision,
};
