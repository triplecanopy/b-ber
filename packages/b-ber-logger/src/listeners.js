/* eslint-disable import/prefer-default-export */


import util from 'util'

export function bind() {
    this.on('begin', ({task}) => {

        this.task         = task
        this.taskWarnings = 0
        this.taskErrors   = 0


        if (this.logLevel < 3) {
            this.incrementIndent()
            return
        }

        const message = util.format.call(util,
            '%s%s %s %s',
            this.indent(),
            this.decorate('b-ber', 'whiteBright', 'bgBlack'),
            this.decorate('info', 'green'),
            this.decorate(task, 'black')
        )

        process.stdout.write(message)

        this.incrementIndent()

    })

    this.on('end', ({task, taskTime}) => {

        this.decrementIndent()

        if (this.logLevel < 3) return

        const {totalMs} = taskTime

        process.stdout.clearLine()
        process.stdout.cursorTo(0)

        const message = util.format.call(util,
            '%s%s %s %s done - %s',
            this.indent(),
            this.decorate('b-ber', 'whiteBright', 'bgBlack'),
            this.decorate('info', 'green'),
            this.decorate(task, 'black'),
            totalMs
        )

        process.stdout.write(message)
        process.stdout.write('\n')

        // const {beginMs, endMs, totalMs} = taskTime
        // if (this.logLevel > 3) {
        //     console.log('%s%s %s', this.indent(), 'Start', beginMs)
        //     console.log('%s%s %s', this.indent(), 'End', endMs)
        //     console.log('%s%s %s', this.indent(), 'Elapsed', totalMs)
        //     console.log()
        //     this.decrementIndent()
        // }

        if (this.taskWarnings) {
            this.printWarnings(task)
        }

        if (this.taskErrors) {
            this.printErrors(task)
        }


    })

    this.on('done', data => {
        let message

        if (this.logLevel === 2) process.stdout.write('\n') // TODO
        if (!this.errors.length) {
            message = util.format.call(util,
                '%s%s %s %s',
                this.indent(),
                this.decorate('b-ber', 'whiteBright', 'bgBlack'),
                this.decorate('info', 'green'),
                this.decorate('Build succeeded', 'green'),
            )
        } else {
            message = util.format.call(util,
                '%s%s %s %s',
                this.indent(),
                this.decorate('b-ber', 'whiteBright', 'bgBlack'),
                this.decorate('info', 'green'),
                this.decorate('Build failed', 'red'),
            )
        }

        process.stdout.write(message)
        process.stdout.write('\n')


        // this.printSummary(data)
    })
}
