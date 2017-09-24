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


        if (this.logLevel > 1) {
            const { beginMs, endMs, totalMs } = taskTime

            console.log()
            console.log('%s%s [%s] after %s', this.indent(), 'Finished', task, totalMs)
            console.log()
            console.log('%s%s %s', this.indent(), 'Start', beginMs)
            console.log('%s%s %s', this.indent(), 'End', endMs)
            console.log('%s%s %s', this.indent(), 'Elapsed', totalMs)
        }

        console.log()
        console.log(this.decorate(['%s%s [%s]', this.indent(), 'Finished', task], 'green'))

        if (this.taskWarnings) {
            console.log()
            this.printWarnings(task)
        }

        if (this.taskErrors) {
            console.log()
            this.printErrors(task)
        }


    })

    this.on('done', (data) => {
        console.log()
        if (!this.errors.length) {
            console.log('%s%s', this.indent(), this.decorate('Build succeeded', 'green', 'underline'))
            console.log()
        } else {
            console.log('%s%s', this.indent(), this.decorate('Build error', 'red', 'underline'))
            console.log()
        }

        this.printSummary(data)
    })
}
