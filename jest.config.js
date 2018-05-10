module.exports = {
    name: 'b-ber',
    setupTestFrameworkScriptFile: 'jest-extended',
    collectCoverage: true,
    coverageReporters: ['html', 'lcov', 'json'],
    testEnvironment: 'jest-environment-jsdom-global',
}

