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
      "branches": 95.53, // TODO 100%
      "functions": 100,
      "lines": 99.43,
      "statements": 99.44
    }
  }
}
