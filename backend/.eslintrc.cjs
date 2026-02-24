module.exports = {
	extends: [],
	parserOptions: {
		tsconfigRootDir: __dirname,
		ecmaFeatures: {
			jsx: true
		},
		project: ["./tsconfig.json"]
	},

	parser: "@typescript-eslint/parser",
	plugins: ["react", "@typescript-eslint", "react-hooks", "no-type-assertion"],
	rules: {
		curly: ["warn"],
		"@typescript-eslint/no-misused-promises": "error",
		"@typescript-eslint/no-unsafe-call": "error",
		"@typescript-eslint/ban-types": "off",
		eqeqeq: ["error", "always", { null: "ignore" }],
		"react/no-array-index-key": "error",
		"@typescript-eslint/no-unused-expressions": ["error"],
		"@typescript-eslint/no-floating-promises": ["error"],
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-var-requires": ["error"],
		"@typescript-eslint/strict-boolean-expressions": ["error"],
		"@typescript-eslint/restrict-template-expressions": [
			"error",
			{
				allowNumber: true,
				allowBoolean: false,
				allowAny: false,
				allowNullish: false,
				allowRegExp: false
			}
		],
		"@typescript-eslint/restrict-plus-operands": ["error"],
		"@typescript-eslint/no-base-to-string": ["error"],
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/no-unnecessary-condition": ["error"],
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^h{1,1}$|^_"
			}
		],
		"no-use-before-define": "off",
		"@typescript-eslint/no-use-before-define": ["error"],
		"react-hooks/rules-of-hooks": "error",
		"react-hooks/exhaustive-deps": "error"
	}
}