import noUnsafeTypeAssertion from "./no-unsafe-type-assertion";
import noUnsafeReadonlyMutableAssignment from "./no-unsafe-readonly-mutable-assignment";
import noUnsafeMutableReadonlyAssignment from "./no-unsafe-mutable-readonly-assignment";
import requireStrictMode from "./require-strict-mode";
import noEnums from "./no-enums";
import noPartialUrlConstructor from "./no-partial-url-constructor";
import noPartialDivision from "./no-partial-division";
import noPartialStringNormalize from "./no-partial-string-normalize";
import noPrematureFpTsEffects from "./no-premature-fp-ts-effects";
import noPartialArrayReduce from "./no-partial-array-reduce";
import noNestedFpTsEffects from "./no-nested-fp-ts-effects";
import noHiddenTypeAssertions from "./no-hidden-type-assertions";

export default {
  "require-strict-mode": requireStrictMode,
  "no-unsafe-type-assertion": noUnsafeTypeAssertion,
  "no-unsafe-readonly-mutable-assignment": noUnsafeReadonlyMutableAssignment,
  "no-unsafe-mutable-readonly-assignment": noUnsafeMutableReadonlyAssignment,
  "no-enums": noEnums,
  "no-partial-url-constructor": noPartialUrlConstructor,
  "no-partial-division": noPartialDivision,
  "no-partial-string-normalize": noPartialStringNormalize,
  "no-premature-fp-ts-effects": noPrematureFpTsEffects,
  "no-nested-fp-ts-effects": noNestedFpTsEffects,
  "no-partial-array-reduce": noPartialArrayReduce,
  "no-hidden-type-assertions": noHiddenTypeAssertions,
};
