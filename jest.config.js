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
      "branches": 95.18, // TODO 100%
      "functions": 100,
      "lines": 98.37,
      "statements": 98.39
    }
  }
}
