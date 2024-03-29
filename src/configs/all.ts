export = {
  extends: ["./configs/base"],
  rules: {
    "total-functions/no-unsafe-type-assertion": "error",
    "total-functions/no-unsafe-readonly-mutable-assignment": "error",
    "total-functions/no-unsafe-mutable-readonly-assignment": "error",
    "total-functions/require-strict-mode": "error",
    "total-functions/no-enums": "error",
    "total-functions/no-partial-url-constructor": "error",
    "total-functions/no-partial-division": "error",
    "total-functions/no-partial-string-normalize": "error",
    "total-functions/no-nested-fp-ts-effects": "error",
    "total-functions/no-premature-fp-ts-effects": "error",
    "total-functions/no-partial-array-reduce": "error",
    "total-functions/no-hidden-type-assertions": "error",
  },
};
