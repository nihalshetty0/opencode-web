import globals from "globals"

import base from "./base.js"

/**
 * A shared ESLint configuration for React projects in the repository.
 *
 * @type {import("eslint").Linter.Config}
 */
export default [
  ...base,
  {
    files: ["**/*.{ts}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
]
