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
      "branches": 96.18, // TODO 100%
      "functions": 100,
      "lines": 98.44,
      "statements": 98.44
    }
  }
}
