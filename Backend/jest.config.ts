import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/models/**",
    "!src/config/**",
    "!src/database/connection.ts",
    "!test/**"
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/models/",
    "<rootDir>/src/services/loggingService.ts",
    "<rootDir>/src/config/",
    "<rootDir>/src/database/",
    "<rootDir>/test/"
  ],
  reporters:
    process.env.CI === "true"
      ? [
          "default",
          [
            "jest-junit",
            {
              outputDirectory: "reports/junit",
              outputName: "jest-results.xml"
            }
          ]
        ]
      : ["default"],
  setupFiles: ["<rootDir>/test/setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/setup/test-datasource.ts"],
  // use 'as any' to suppress regex key parsing
  moduleNameMapper: {
    "^@database$": "<rootDir>/src/database/connection",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@repositories/(.*)$": "<rootDir>/src/repositories/$1",
    "^@dao/(.*)$": "<rootDir>/src/models/dao/$1",
    "^@utils$": "<rootDir>/src/utils",
    "^@dto/(.*)$": "<rootDir>/src/models/dto/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@config$": "<rootDir>/src/config/config",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@errors/(.*)$": "<rootDir>/src/models/errors/$1",
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@app$": "<rootDir>/src/app",
    "^@test/(.*)$": "<rootDir>/test/$1"
  } as any,
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  maxWorkers: 1
};

export default config;
