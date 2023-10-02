module.exports = {
  extends: ["next", "turbo"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
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
  },
};
