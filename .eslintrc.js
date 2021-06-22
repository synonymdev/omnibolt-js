module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	globals: {
		localStorage: false,
	},
	rules: {
		semi: 'off',
		'@typescript-eslint/semi': ['error'],
		'no-shadow': 'off',
		'@typescript-eslint/no-shadow': 'error',
		'@typescript-eslint/no-unused-vars': 'error',
		'no-console': 0,
		'no-empty': ['error', { allowEmptyCatch: true }],
		'no-buffer-constructor': 0,
		'no-case-declarations': 0,
		'no-useless-escape': 0,
		indent: [
			2,
			'tab',
			{ SwitchCase: 1, ignoredNodes: ['ConditionalExpression'] },
		],
		'object-curly-spacing': [
			'error',
			'always',
			{
				objectsInObjects: true,
			},
		],
		'no-undef': 0,
		'require-atomic-updates': 0,
		'no-async-promise-executor': 0,
		'brace-style': [2, '1tbs', { allowSingleLine: true }],
		'@typescript-eslint/explicit-function-return-type': 'warn',
	},
};
