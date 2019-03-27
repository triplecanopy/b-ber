/* eslint-disable import/prefer-default-export */

import util from 'util'

export function bind() {
    this.on('begin', ({ task }) => {
        this.task = task
        this.taskWarnings = 0
        this.taskErrors = 0

        if (this.logLevel < 3) {
            this.incrementIndent()
            return
        }

        const message = util.format.call(
            util,
            '%s%s %s %s %s',
            this.indent(),
            this.decorate('b-ber', 'whiteBright', 'bgBlack'),
            this.decorate('info', 'green'),
            this.decorate(task),
            this.decorate('start'),
        )

        process.stdout.write(message)
        this.newLine()

        this.incrementIndent()
    })

    this.on('end', ({ task, taskTime }) => {
        this.decrementIndent()

        if (this.logLevel < 3) return

        const { totalMs } = taskTime

        process.stdout.clearLine()
        process.stdout.cursorTo(0)

        const message = util.format.call(
            util,
            '%s%s %s %s done - %s',
            this.indent(),
            this.decorate('b-ber', 'whiteBright', 'bgBlack'),
            this.decorate('info', 'green'),
            this.decorate(task),
            totalMs,
        )

        process.stdout.write(message)
        this.newLine()
    })

    this.on('done', data => {
        // eslint-disable-line no-unused-vars
        const message = util.format.call(
            util,
            '%s%s %s %s',
            this.indent(),
            this.decorate('b-ber', 'whiteBright', 'bgBlack'),
            this.decorate('info', 'green'),
            this.decorate('Build succeeded', 'green'),
        )

        process.stdout.write(message)
        this.newLine()
        if (this.summary) this.printSummary(data)
    })
}
