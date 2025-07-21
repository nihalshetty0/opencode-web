import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import { globalIgnores } from "eslint/config"
import globals from "globals"

import base from "./base.js"

/**
 * A shared ESLint configuration for React projects in the repository.
 *
 * @type {import("eslint").Linter.Config}
 */
export default [
  globalIgnores(["dist"]),
  ...base,
  reactHooks.configs["recommended-latest"],
  reactRefresh.configs.vite,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]
