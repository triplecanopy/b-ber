export function bind() {
    this.on('begin', ({ task, begin }) => {

        if (this.logLevel === 0) { return }

        console.log()
        console.log('%s%s [%s]', this.indent(), 'Starting', task)

        this.taskWarnings = 0
        this.taskErrors   = 0

        this.incrementIndent()
    })

    this.on('end', ({ task, taskTime }) => {

        if (this.logLevel === 0) { return }

        this.decrementIndent()

        const { beginMs, endMs, totalMs } = taskTime

        console.log()
        console.log('%s%s [%s] after %s', this.indent(), 'Finished', task, totalMs)
        console.log()
        console.log('%s%s %s', this.indent(), 'Start', beginMs)
        console.log('%s%s %s', this.indent(), 'End', endMs)
        console.log('%s%s %s', this.indent(), 'Elapsed', totalMs)
        console.log()

        if (this.taskWarnings) {
            this.printWarnings(task)
        }

        if (this.taskErrors) {
            this.printErrors(task)
        }

        if (!this.taskWarnings && !this.taskErrors) {
            console.log(this.decorate(['%s%s [%s] %s', this.indent(), 'Finished', task, 'with no errors or warnings'], 'green'))
        }

    })

    this.on('done', (data) => {
        console.log()
        console.log('%s%s', this.indent(), this.decorate('Build complete', 'underline'))
        console.log()

        this.printSummary(data)
    })
}
