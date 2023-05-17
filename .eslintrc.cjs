module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "standard-with-typescript",
  ],
  "overrides": [],
  "parserOptions": {
    "project": "tsconfig.json",
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "react"
  ],
  "rules": {
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "@typescript-eslint/object-curly-spacing": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/space-infix-ops": "off",
    "operator-linebreak": "off",
    "@typescript-eslint/space-before-function-paren": "off",
    "@typescript-eslint/comma-dangle": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
