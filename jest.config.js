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
      "branches": 96.92, // TODO 100%
      "functions": 100,
      "lines": 98.56,
      "statements": 98.57
    }
  }
}
