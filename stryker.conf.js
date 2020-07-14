module.exports = function(config) {
  config.set({
    mutator: {
      name: "typescript",
      // These are only error message strings (for UI/CLI) so only contribute noise to the mutation output & score.
      excludedMutations: ["StringLiteral"]
    },
    packageManager: "yarn",
    reporters: ["clear-text", "progress", "dashboard"],
    testRunner: "jest",
    transpilers: [],
    coverageAnalysis: "off",
    tsconfigFile: "tsconfig.json",
    mutate: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/index.ts", "!src/configs/*.ts"]
  });
};
