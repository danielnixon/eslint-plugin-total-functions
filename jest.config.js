module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "collectCoverage": true,
  "coverageThreshold": {
    "global": {
      "branches": 94, // TODO 100%
      "functions": 100,
      "lines": 97.89,
      "statements": 97.9
    }
  }
}
