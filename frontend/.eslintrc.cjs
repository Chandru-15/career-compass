module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["react-hooks"],
  extends: ["eslint:recommended"],
  ignorePatterns: ["dist", "node_modules", ".npm-cache"],
  rules: {
    "no-unused-vars": "off",
    "no-undef": "off",
    "react-hooks/rules-of-hooks": "error",
  },
  overrides: [{ files: ["*.config.*", ".eslintrc.cjs"], env: { node: true } }],
};
