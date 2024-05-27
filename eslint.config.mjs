import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import TsParser from '@typescript-eslint/parser';
import UnicornPlugin from 'eslint-plugin-unicorn';
import ImportPlugin from 'eslint-plugin-import';

const plugins = {
    import: ImportPlugin,
    unicorn: UnicornPlugin,
};
export default [
    {
        name: 'Global ignores',
        ignores: ['dist/**', '**/*.cjs'],
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: TsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                project: ['./tsconfig.json'],
                warnOnUnsupportedTypeScriptVersion: false,
                allowAutomaticSingleRunInference: true,
            },
        },
        plugins,
        rules: {
            'import/no-duplicates': 'error',
            'import/no-unresolved': 'off',
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', ['sibling', 'parent', 'index'], 'type', 'unknown'],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
            'import/no-default-export': 'error',
            'no-implicit-coercion': 'error',
            'max-classes-per-file': ['error', { ignoreExpressions: true }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
            '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
            '@typescript-eslint/ban-types': [
                'error',
                {
                    types: {
                        String: {
                            message: 'Use string instead',
                            fixWith: 'string',
                        },
                        '{}': {
                            message: 'Use Record<K, V> instead',
                            fixWith: 'Record<K, V>',
                        },
                        object: {
                            message: 'Use Record<K, V> instead',
                            fixWith: 'Record<K, V>',
                        },
                    },
                },
            ],
            '@typescript-eslint/quotes': [
                'error',
                'single',
                {
                    avoidEscape: true,
                },
            ],
            '@typescript-eslint/semi': ['error', 'always'],
            '@typescript-eslint/no-for-in-array': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'default',
                    format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
                    filter: {
                        regex: '^_.*$',
                        match: false,
                    },
                },
                {
                    selector: 'variable',
                    format: ['camelCase', 'UPPER_CASE'],
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
                {
                    selector: 'memberLike',
                    modifiers: ['private'],
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                },
                {
                    selector: 'enumMember',
                    format: ['UPPER_CASE'],
                },
                {
                    selector: 'classProperty',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
            ],
            '@typescript-eslint/prefer-nullish-coalescing': [
                'error',
                {
                    ignoreTernaryTests: false,
                },
            ],
            '@typescript-eslint/prefer-regexp-exec': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/no-base-to-string': 'error',
            '@typescript-eslint/no-this-alias': 'error',
            '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            'unicorn/better-regex': 'error',
            'unicorn/catch-error-name': 'error',
            'unicorn/consistent-destructuring': 'error',
            'unicorn/consistent-function-scoping': 'warn',
            'unicorn/custom-error-definition': 'off',
            'unicorn/empty-brace-spaces': 'error',
            'unicorn/error-message': 'error',
            'unicorn/escape-case': 'error',
            'unicorn/expiring-todo-comments': 'error',
            'unicorn/explicit-length-check': 'error',
            'unicorn/number-literal-case': 'error',
            'unicorn/numeric-separators-style': 'error',
            'unicorn/filename-case': [
                'error',
                {
                    cases: {
                        kebabCase: true,
                        pascalCase: true,
                    },
                },
            ],
            'unicorn/import-style': 'error',
            'unicorn/new-for-builtins': 'error',
            'unicorn/no-abusive-eslint-disable': 'error',
            'unicorn/no-array-callback-reference': 'warn',
            'unicorn/no-array-for-each': 'warn',
            'unicorn/no-array-push-push': 'error',
            'unicorn/no-for-loop': 'error',
            'unicorn/no-hex-escape': 'error',
            'unicorn/no-instanceof-array': 'error',
            'unicorn/no-keyword-prefix': 'off',
            'unicorn/no-lonely-if': 'error',
            'unicorn/prefer-array-find': 'error',
            'unicorn/prefer-array-flat': 'error',
            'unicorn/prefer-array-flat-map': 'error',
            'unicorn/prefer-array-index-of': 'error',
            'unicorn/prefer-array-some': 'error',
            'unicorn/prefer-date-now': 'error',
            'unicorn/prefer-default-parameters': 'error',
            'unicorn/prefer-includes': 'error',
            'unicorn/prefer-math-trunc': 'error',
            'unicorn/prefer-module': 'off',
            'unicorn/prefer-negative-index': 'error',
            'unicorn/prefer-node-protocol': 'off',
            'unicorn/prefer-number-properties': 'error',
            'unicorn/prefer-optional-catch-binding': 'error',
            'unicorn/prefer-reflect-apply': 'error',
            'unicorn/prefer-regexp-test': 'error',
            'unicorn/prefer-set-has': 'error',
            'unicorn/prefer-spread': 'error',
            'unicorn/prefer-string-replace-all': 'off',
            'unicorn/prefer-string-slice': 'error',
            'unicorn/prefer-string-starts-ends-with': 'error',
            'unicorn/prefer-string-trim-start-end': 'error',
            'unicorn/prefer-switch': 'error',
            'unicorn/prefer-ternary': 'error',
            'unicorn/prefer-type-error': 'error',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/string-content': 'off',
            'unicorn/throw-new-error': 'error',
            'unicorn/no-unnecessary-await': 'error',
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'no-public',
                    overrides: {
                        accessors: 'no-public',
                        constructors: 'off',
                        methods: 'no-public',
                        properties: 'off',
                        parameterProperties: 'explicit',
                    },
                },
            ],
        },
    },
    {
        name: 'spec',
        files: ['**/*.spec.ts', '**/*.spec.tsx', 'spec/**/*.ts', 'spec/**/*.tsx'],
        languageOptions: {
            parser: TsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                project: ['./tsconfig.json'],
                warnOnUnsupportedTypeScriptVersion: false,
                allowAutomaticSingleRunInference: true,
            },
        },
        plugins,
        rules: {
            'max-classes-per-file': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            'unicorn/consistent-function-scoping': 'off',
        },
    },
];
