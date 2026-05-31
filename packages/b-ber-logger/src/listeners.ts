import util from 'util'

export function bind(this: any): void {
  this.on('begin', ({ task }: { task: string }) => {
    this.task = task
    this.taskWarnings = 0
    this.taskErrors = 0

    if (this.logLevel < 3) {
      this.incrementIndent()
      return
    }

    this.incrementIndent()
  })

  this.on('end', ({ task, taskTime }: { task: string; taskTime: { totalMs: string } }) => {
    this.decrementIndent()

    if (this.logLevel < 3) return

    const { totalMs } = taskTime

    ;(process.stdout as NodeJS.WriteStream).clearLine(0)
    ;(process.stdout as NodeJS.WriteStream).cursorTo(0)

    const message = util.format.call(
      util,
      '%s%s %s %s %s done (%s)',
      this.indent(),
      this.decorate(`[${new Date().toISOString()}]`, 'gray'),
      this.decorate('b-ber', 'whiteBright', 'bgBlack'),
      this.decorate('info', 'green'),
      this.decorate(task),
      totalMs
    )

    process.stdout.write(message)
    this.newLine()

    if (this.logLevel > 4) {
      const { stack } = new Error()
      process.stdout.write(
        util.format.call(util, stack!.replace(/^Error\s+/, 'Info '))
      )
      this.newLine()
    }
  })

  this.on('done', (data: unknown) => {
    if (this.logLevel < 1) return

    const message = util.format.call(
      util,
      '%s%s %s %s',
      this.indent(),
      this.decorate('b-ber', 'whiteBright', 'bgBlack'),
      this.decorate('info', 'green'),
      this.decorate('Build succeeded', 'green')
    )

    process.stdout.write(message)
    this.newLine()
    if (this.summary) this.printSummary(data)
  })
}
