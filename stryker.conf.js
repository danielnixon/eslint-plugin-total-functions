module.exports = {
  mutator: {
    // These are only error message strings (for UI/CLI) so only contribute noise to the mutation output & score.
    excludedMutations: ["StringLiteral"]
  },
  packageManager: "yarn",
  reporters: ["clear-text", "progress", "dashboard"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  mutate: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/index.ts", "!src/configs/*.ts"]
};
