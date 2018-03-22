/* eslint-disable import/prefer-default-export */

function printNavigationTree(state) {

    console.log('%s%s', this.indent(), this.decorate('Structure', 'cyan'))
    this.incrementIndent()

    function parse(items, context) {
        items.forEach(item => {
            console.log('%s%s', context.indent(), item.title || `[${item.name}]`)
            if (item.nodes && item.nodes.length) {
                context.incrementIndent()
                parse(item.nodes, context)
                context.decrementIndent()
            }
        })
    }

    parse(state.toc, this)

    this.decrementIndent()
}



export function summary({state, formattedStartDate, formattedEndDate, sequenceEnd}) {

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
    Object.entries(state.config).forEach(([k, v]) => console.log('%s%s: %s', this.indent(), k, v))
    this.decrementIndent()
    console.log()

    console.log(this.decorate('%sMetadata', 'cyan'), this.indent())
    this.incrementIndent()
    state.metadata.forEach(a => console.log('%s%s: %s', this.indent(), a.term, a.value))
    this.decrementIndent()
    console.log()

    printNavigationTree.call(this, state)

    console.log()
    console.log('%s%s %s %s', this.indent(), 'Created', state.spine.length, 'XHTML file(s)')
    console.log('%s%s %s %s', this.indent(), 'Created', state.figures.length, 'figures(s)')
    console.log()
    console.log('%s%s %s', this.indent(), 'b-ber version', state.version)
    console.log()

}
