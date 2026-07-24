import eslint from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "apps/api/uploads/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/web/public/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    }
  }
);
