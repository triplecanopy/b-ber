export function bind() {
    this.on('begin', ({ task, begin }) => {

        this.task         = task
        this.taskWarnings = 0
        this.taskErrors   = 0


        if (this.logLevel < 3) {
            this.incrementIndent()
            return
        }

        console.log('%s%s [%s]', this.indent(), 'Starting', task)

        this.incrementIndent()

    })

    this.on('end', ({ task, taskTime }) => {

        this.decrementIndent()

        if (this.logLevel < 3) { return }

        const { beginMs, endMs, totalMs } = taskTime

        if (this.logLevel > 3) {
            this.incrementIndent()
            console.log()
            console.log('%s%s %s', this.indent(), 'Start', beginMs)
            console.log('%s%s %s', this.indent(), 'End', endMs)
            console.log('%s%s %s', this.indent(), 'Elapsed', totalMs)
            console.log()
            this.decrementIndent()
        }

        console.log(this.decorate(['%s%s [%s] after %s', this.indent(), 'Finished', task, totalMs], 'green'))
        console.log()

        if (this.taskWarnings) {
            this.printWarnings(task)
        }

        if (this.taskErrors) {
            this.printErrors(task)
        }


    })

    this.on('done', (data) => {
        if (this.logLevel < 3) { console.log() }
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
