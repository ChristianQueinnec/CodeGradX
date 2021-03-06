module.exports = {
    "rules": {
        "linebreak-style": [
            2,
            "unix"
        ],
        "semi": [
            2,
            "always"
        ]
    },
    "parserOptions": {
        "ecmaVersion": 2017,
        "sourceType": "module"
    },
    "env": {
        "es6": true,
        "browser": true,
        "node": true
    },
    "globals": {
        "grecaptcha": true,
        "google": true,
        "console": true,
        "CodeGradX": true
    },
    "extends": "eslint:recommended"
};
