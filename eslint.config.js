import { defineConfig } from 'eslint/config';
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parser: tsParser,
            parserOptions: {
                project: true,
                ecmaVersion: 'latest',
            },
            sourceType: 'module',
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: eslintPluginPrettier,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            // ...tsPlugin.configs['strict-type-checked'].rules,
            // ...tsPlugin.configs['stylistic-type-checked'].rules,
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            'no-console': 'error',
            'prettier/prettier': 'error',
        },
        settings: {
            // Section for future global types (e.g., scraper stats on exit)
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
]);
