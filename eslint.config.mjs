// eslint.config.js
import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin"
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.txt.js",
      "main.js",
    ],
  },
  {
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    files: [ "**/*.ts" ],
    plugins: {
      "@eslint": eslint,
      "@typescript-eslint": tseslint.plugin,
      "@stylistic": stylistic,
    },
    extends: [
      "@typescript-eslint/recommended",
      "@stylistic/recommended" ],
    rules: {
      "curly": "error",
      "no-duplicate-imports": "error",
      "prefer-const": "warn",
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-for-in-array": "warn",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@stylistic/array-bracket-spacing": [ "error", "always", { "singleValue": false, "objectsInArrays": false, "arraysInArrays": false }],
      "@stylistic/array-element-newline": ["error", { "consistent": true, "multiline": true }],
      "@stylistic/brace-style": [ "error", "1tbs" ],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/function-call-spacing": ["error", "never"],
      "@stylistic/function-paren-newline": ["error", "multiline"],
      "@stylistic/indent": [ "error", 2 ],
      "@stylistic/keyword-spacing": "error",
      "@stylistic/object-curly-spacing": [ "error", "always", { "objectsInObjects": false, "arraysInObjects": false }],
      "@stylistic/object-property-newline": ["error", { "allowAllPropertiesOnSameLine": true }],
      "@stylistic/quotes": [ "error", "double", { "allowTemplateLiterals": "always" }],
      "@stylistic/semi": ["error", "always", { "omitLastInOneLineBlock": true}],
      "@stylistic/semi-style": ["error", "last"],
   },
  }
]);