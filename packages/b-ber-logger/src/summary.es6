/* eslint-disable import/prefer-default-export */

function printNavigationTree(store) {
    const _this = this

    console.log('%s%s', this.indent(), this.decorate('Structure', 'cyan'))
    this.incrementIndent()

    function parse(items) {
        items.forEach(item => {
            console.log('%s%s', _this.indent(), item.title || `[${item.name}]`)
            if (item.nodes && item.nodes.length) {
                _this.incrementIndent()
                parse(item.nodes)
                _this.decrementIndent()
            }
        })
    }

    parse(store.toc)

    this.decrementIndent()
}



export function summary({ store, formattedStartDate, formattedEndDate, sequenceEnd }) {

    if (this.logLevel < 4 && this.summarize !== true) { return }

    console.log('%s%s', this.indent(), '-'.repeat(this.consoleWidth))
    console.log()
    console.log('%s%s', this.indent(), 'Summary')
    console.log()
    console.log('%s%s', this.indent(), '-'.repeat(this.consoleWidth))
    console.log()

    console.log(this.decorate('%sBuild start: %s', 'cyan'), this.indent(), formattedStartDate)
    console.log(this.decorate('%sBuild end: %s', 'cyan'), this.indent(), formattedEndDate)
    console.log(this.decorate('%sElapsed time: %s', 'cyan'), this.indent(), sequenceEnd)
    console.log()

    this.printWarnings()
    console.log()

    this.printErrors()
    console.log()

    console.log(this.decorate('%sConfiguration', 'cyan'), this.indent())
    this.incrementIndent()
    Object.entries(store.config).forEach(([k, v]) => {
        console.log('%s%s: %s', this.indent(), k, v)
    })
    this.decrementIndent()
    console.log()

    console.log(this.decorate('%sMetadata', 'cyan'), this.indent())
    this.incrementIndent()
    store.metadata.forEach(_ => {
        console.log('%s%s: %s', this.indent(), _.term, _.value)
    })
    this.decrementIndent()
    console.log()

    printNavigationTree.call(this, store)
    console.log()
    console.log('%s%s %s %s', this.indent(), 'Created', store.spine.length, 'XHTML file(s)')
    console.log('%s%s %s %s', this.indent(), 'Created', store.figures.length, 'figures(s)')
    console.log()
    console.log('%s%s %s', this.indent(), 'b-ber version', store.version)
    console.log()

}
