import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules"],
  },
  {
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    files: ["**/*.ts"],
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
);
