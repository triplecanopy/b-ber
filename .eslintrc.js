module.exports = {
    parser: 'babel-eslint',
    extends: ['airbnb', 'prettier', 'prettier/react', 'prettier/standard'],
    env: {
        es6: true,
        jest: true,
        mocha: true,
        node: true,
    },
    plugins: ['babel', 'import', 'react', 'prettier'],
    rules: {
        'prettier/prettier': 'error',
        'arrow-parens': 0,
        'consistent-return': 0,
        'import/extensions': [2, 'never'],
        'jsx-a11y/href-no-hash': 0,
        'jsx-a11y/label-has-for': [
            2,
            {
                allowChildren: false,
                required: {
                    some: ['nesting', 'id'],
                },
            },
        ],
        'max-statements-per-line': [
            2,
            {
                max: 2,
            },
        ],
        'no-cond-assign': [2, 'except-parens'],
        'no-confusing-arrow': 0,
        'no-console': 0,
        'no-extra-semi': 0,
        'no-mixed-operators': 0,
        'no-nested-ternary': 0,
        'no-plusplus': [
            2,
            {
                allowForLoopAfterthoughts: true,
            },
        ],
        'no-return-assign': 0,
        'no-underscore-dangle': 0,
        'no-unused-vars': [
            2,
            {
                argsIgnorePattern: '^_$',
            },
        ],
        'object-curly-spacing': 0,
        'one-var': [
            2,
            {
                uninitialized: 'never',
                initialized: 'never',
            },
        ],
        'operator-linebreak': 0,
        'padded-blocks': 0,
        'react/jsx-boolean-value': 0,
        'react/jsx-indent': 0,
        'react/no-array-index-key': 0,
        'react/no-danger': 0,
        'react/prop-types': 0,
        'react/prefer-stateless-function': 0,
        'react/require-extension': 'off',
        'react/sort-comp': 0,
        'spaced-comment': 0,
        strict: 0,
    },
    globals: {
        document: true,
        window: true,
    },
}
