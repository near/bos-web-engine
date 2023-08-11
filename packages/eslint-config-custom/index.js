module.exports = {
  extends: ["next", "turbo", "prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "comma-dangle": ["error", {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "always-multiline",
      "exports": "always-multiline",
      "functions": "never"
    }],
    "import/order": [
      "error",
      {
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "always",
        "groups": [
          "builtin",
          ["external", "internal"],
          ["sibling", "parent", "index"],
          "object"
        ]
      }
    ],
    "indent": ["error", 2, {
      "SwitchCase": 2,
    }],
    "no-multiple-empty-lines": ["error", {
      "max": 2,
      "maxEOF": 0
    }],
    "no-trailing-spaces": ["error"],
    "object-curly-spacing": ["error", "always"],
    "quotes": ["error", "single"],
    "quote-props": ["error", "as-needed"],
    "semi": ["error", "always"]
  },
  parserOptions: {
    babelOptions: {
      presets: [require.resolve("next/babel")],
    },
  },
};
