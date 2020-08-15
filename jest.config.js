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
      "branches": 96.32, // TODO 100%
      "functions": 100,
      "lines": 98.96,
      "statements": 98.96
    }
  }
}
