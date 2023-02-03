/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-default-export */
import type { Config } from 'jest';

const config: Config = {
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        },
    },
    moduleFileExtensions: ['js', 'json', 'ts'],
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                isolatedModules: true,
            },
        ],
    },
    testTimeout: 120_000,
    testEnvironment: 'node',
    verbose: true,
    detectLeaks: false,
    detectOpenHandles: true,
    collectCoverage: true,
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageReporters: ['text'],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            statements: 60,
            branches: 60,
            functions: 60,
            lines: 60,
        },
    },
    coveragePathIgnorePatterns: ['<rootDir>/jest.config.ts', '.mock.ts'],
};

export default config;
