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
      "branches": 97.28, // TODO 100%
      "functions": 100,
      "lines": 98.9,
      "statements": 98.91
    }
  }
}
