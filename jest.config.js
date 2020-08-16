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
      "branches": 96.75, // TODO 100%
      "functions": 100,
      "lines": 98.91,
      "statements": 98.91
    }
  }
}
