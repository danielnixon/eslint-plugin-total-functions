export = {
  extends: ["./configs/base"],
  rules: {
    "total-functions/no-unsafe-type-assertion": "error",
    "total-functions/no-unsafe-readonly-mutable-assignment": "error",
    // TODO this is too noisy until https://github.com/danielnixon/eslint-plugin-total-functions/issues/83 lands
    // "total-functions/no-unsafe-optional-property-assignment": "error",
    "total-functions/require-strict-mode": "error",
    "total-functions/no-unsafe-enum-assignment": "error",
  },
};
