/* eslint-disable import/prefer-default-export */

export function bind() {
    this.on('begin', ({task}) => {

        this.task         = task
        this.taskWarnings = 0
        this.taskErrors   = 0


        if (this.logLevel < 3) {
            this.incrementIndent()
            return
        }

        console.log(
            '%s%s %s Starting',
            this.indent(),
            this.decorate('b-ber', 'white', 'bgBlack'),
            this.decorate('info', 'green'),
            // this.counter(),
            this.decorate(task, 'magenta')
        )

        // console.log(
        //     '%s%s %s %s Starting',
        //     this.indent(),
        //     this.decorate('b-ber', 'white', 'bgBlack'),
        //     this.decorate('info', 'green'),
        //     this.counter(),
        //     this.decorate(task, 'magenta')
        // )

        this.incrementIndent()

    })

    this.on('end', ({task, taskTime}) => {

        this.decrementIndent()

        if (this.logLevel < 3) return

        const {totalMs} = taskTime

        console.log(
            '%s%s %s Finished',
            this.indent(),
            this.decorate('b-ber', 'white', 'bgBlack'),
            this.decorate('info', 'green'),
            // this.counter(),
            this.decorate(task, 'green'),
            'after',
            totalMs
        )

        // console.log(
        //     '%s%s %s %s Finished',
        //     this.indent(),
        //     this.decorate('b-ber', 'white', 'bgBlack'),
        //     this.decorate('info', 'green'),
        //     this.counter(),
        //     this.decorate(task, 'green'),
        //     'after',
        //     totalMs
        // )

        // const {beginMs, endMs, totalMs} = taskTime
        // if (this.logLevel > 3) {
        //     console.log('%s%s %s', this.indent(), 'Start', beginMs)
        //     console.log('%s%s %s', this.indent(), 'End', endMs)
        //     console.log('%s%s %s', this.indent(), 'Elapsed', totalMs)
        //     console.log()
        //     this.decrementIndent()
        // }

        if (this.taskWarnings) {
            console.log()
            this.printWarnings(task)
            console.log()
        }

        if (this.taskErrors) {
            console.log()
            this.printErrors(task)
            console.log()
        }


    })

    this.on('done', data => {

        console.log()

        if (!this.errors.length) {
            console.log('%s%s', this.indent(), this.decorate('Build succeeded', 'green'))
        } else {
            console.log('%s%s', this.indent(), this.decorate('Build error', 'red'))
        }

        console.log()

        // this.printSummary(data)
    })
}
