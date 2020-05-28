module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', '@typescript-eslint/tslint', 'prefer-arrow', 'import'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'prettier/@typescript-eslint'],
  rules: {
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/ban-types': 'error',
    '@typescript-eslint/class-name-casing': 'error',
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'explicit',
        overrides: {
          constructors: 'no-public'
        }
      }
    ],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/interface-name-prefix': 'error',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }
    ],
    '@typescript-eslint/member-ordering': 'error',
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-namespace': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    'no-param-reassign': 'error',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-unnecessary-qualifier': 'error',
    '@typescript-eslint/no-unnecessary-type-arguments': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-use-before-define': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/prefer-for-of': 'off',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/space-within-parens': ['off', 'never'],
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/triple-slash-reference': 'error',
    '@typescript-eslint/type-annotation-spacing': 'off',
    '@typescript-eslint/unbound-method': 'error',
    '@typescript-eslint/unified-signatures': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'arrow-parens': ['off', 'as-needed'],
    '@typescript-eslint/camelcase': 'warn',
    'class-methods-use-this': 'off',
    'comma-dangle': 'off',
    complexity: 'error',
    'constructor-super': 'error',
    curly: 'error',
    'default-case': 'error',
    'dot-notation': 'error',
    'eol-last': 'off',
    eqeqeq: ['error', 'smart'],
    'guard-for-in': 'error',
    'id-blacklist': [
      'warn',
      'err',
      'e',
      'cb',
      'callback',
      'result',
      'res',
      'any',
      'Number',
      'number',
      'String',
      'string',
      'Boolean',
      'boolean',
      'Undefined'
    ],
    'id-match': 'error',
    'import/no-default-export': 'error',
    'import/no-deprecated': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: false
      }
    ],
    'import/no-internal-modules': 'off',
    'import/no-unassigned-import': 'off',
    'import/order': 'error',
    'linebreak-style': 'off',
    'max-classes-per-file': ['error', 1],
    'max-len': 'off',
    'max-lines': ['error', 400],
    'new-parens': 'off',
    'newline-per-chained-call': 'off',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-cond-assign': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-case': 'error',
    'no-duplicate-imports': 'error',
    'no-empty': 'error',
    'no-eval': 'error',
    'no-extra-semi': 'off',
    'no-fallthrough': 'error',
    'no-invalid-this': 'error',
    'no-irregular-whitespace': 'off',
    'no-magic-numbers': 'off',
    'no-multiple-empty-lines': 'off',
    'no-new-wrappers': 'error',
    'no-null/no-null': 'off',
    'no-redeclare': 'error',
    'no-return-await': 'error',
    'no-sequences': 'error',
    'no-shadow': [
      'error',
      {
        hoist: 'all'
      }
    ],
    'no-sparse-arrays': 'error',
    'no-template-curly-in-string': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'off',
    'no-undef-init': 'error',
    'no-underscore-dangle': ['error', { allowAfterThis: true, allowAfterSuper: true }],
    'no-unsafe-finally': 'error',
    'no-unused-expressions': 'error',
    'no-unused-labels': 'error',
    'no-var': 'error',
    'no-void': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: '*',
        next: 'return'
      }
    ],
    'prefer-arrow/prefer-arrow-functions': 'error',
    'prefer-const': 'error',
    'prefer-object-spread': 'off',
    '@typescript-eslint/prefer-readonly': 'error',
    'prefer-template': 'error',
    'quote-props': 'off',
    radix: 'error',
    'space-before-function-paren': 'off',
    'spaced-comment': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'off',
    yoda: 'error',
    '@typescript-eslint/tslint/config': [
      'error',
      {
        rules: {
          ban: [true, 'fit', 'fdescribe', 'xit', 'xdescribe'],
          encoding: true,
          'import-blacklist': [true, 'rxjs', 'rxjs/Rx', 'lodash'],
          'jsdoc-format': true,
          'match-default-export-name': true,
          'no-boolean-literal-compare': true,
          'no-dynamic-delete': true,
          'no-inferred-empty-object-type': true,
          'no-mergeable-namespace': true,
          'no-reference-import': true,
          'no-unnecessary-callback-wrapper': true,
          'no-unused-variable': true,
          'prefer-conditional-expression': true,
          'prefer-method-signature': true,
          'prefer-switch': true,
          'prefer-while': true,
          'return-undefined': true,
          'switch-final-break': true,
          typedef: [
            false,
            'call-signature',
            'arrow-call-signature',
            'parameter',
            'arrow-parameter',
            'property-declaration',
            'variable-declaration',
            'member-variable-declaration',
            'object-destructuring',
            'array-destructuring'
          ]
        }
      }
    ],
    'no-implicit-coercion': 'error'
  }
}
