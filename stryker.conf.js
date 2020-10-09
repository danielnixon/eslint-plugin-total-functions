module.exports = {
  mutator: {
    // These are only error message strings (for UI/CLI) so only contribute noise to the mutation output & score.
    excludedMutations: ["StringLiteral"]
  },
  packageManager: "yarn",
  reporters: ["clear-text", "progress", "dashboard"],
  testRunner: "jest",
  // TODO: https://github.com/stryker-mutator/stryker/issues/2316
  coverageAnalysis: "off",
  // TODO
  // checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  mutate: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/index.ts", "!src/configs/*.ts"]
};
