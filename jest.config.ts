/* eslint-disable @typescript-eslint/naming-convention  */
import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    transform: {
        '^.+\\.spec\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
            },
        ],
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
            },
        ],
    },
    testTimeout: 120_000,
    testEnvironment: 'node',
    verbose: true,
    detectLeaks: false,
    detectOpenHandles: true,
    collectCoverage: true,
    collectCoverageFrom: ['**/*.ts', '!**/*.d.ts'],
    coverageThreshold: {
        global: {
            statements: 60,
            branches: 60,
            functions: 60,
            lines: 60,
        },
    },
    coveragePathIgnorePatterns: ['<rootDir>/jest.config.ts', '.mock.ts', 'spec/'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
