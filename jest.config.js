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
      "branches": 97.06, // TODO 100%
      "functions": 100,
      "lines": 99.47,
      "statements": 99.47
    }
  }
}
