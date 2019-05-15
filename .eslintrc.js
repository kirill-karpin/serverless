module.exports = {
  "root": true,
  "extends": "airbnb",
  "plugins": [],
  "rules": {
    "func-names": "off",

    // doesn't work in node v4 :(
    "strict": "off",
    "prefer-rest-params": "off",
    "react/require-extension": "off",
    "import/no-extraneous-dependencies": "off"
  },
  "parserOptions": {
    "ecmaVersion": 2018,
  },
  "env": {
    "mocha": true,
    "jest": true
  }
};
