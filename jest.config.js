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
      "branches": 97.83, // TODO 100%
      "functions": 100,
      "lines": 99.27,
      "statements": 99.27
    }
  }
}
