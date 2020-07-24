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
      "branches": 93.33, // TODO 100%
      "functions": 100,
      "lines": 97.92,
      "statements": 97.92
    }
  }
}
