module.exports = {
    '*.+(ts|js|json)': ['eslint -c eslint.config.mjs', 'prettier --write'],
    '*.+(ts)': [() => 'tsc -p tsconfig.json --noEmit', () => 'tsc -p tsconfig.spec.json --noEmit'],
};
