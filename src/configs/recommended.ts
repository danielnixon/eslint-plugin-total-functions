export = {
  extends: ["./configs/base"],
  rules: {
    "total-functions/no-unsafe-type-assertion": "error",
    "total-functions/no-unsafe-readonly-mutable-assignment": "error",
    // TODO this is too noisy until https://github.com/danielnixon/eslint-plugin-total-functions/issues/83 lands
    // "total-functions/no-unsafe-optional-property-assignment": "error",
    "total-functions/require-strict-mode": "error",
    "total-functions/no-unsafe-enum-assignment": "error",
    "total-functions/no-enums": "error",
    "total-functions/no-partial-url-constructor": "error",
    "total-functions/no-partial-division": "error",
    "total-functions/no-partial-string-normalize": "error",
    // Not ready for prime time
    // "total-functions/no-nested-fp-ts-effects": "error",
    "total-functions/no-premature-fp-ts-effects": "error",
    "total-functions/no-partial-array-reduce": "error",
  },
};
