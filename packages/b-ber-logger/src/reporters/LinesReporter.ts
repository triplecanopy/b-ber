import { Formatter } from '../format'
import {
  type BuildPlan,
  type DoneEvent,
  LEVEL,
  type LoggerEvents,
  type LogMessage,
  type Reporter,
  type ReporterSource,
} from '../types'

type Output = Pick<NodeJS.WriteStream, 'write'>

// A line per message, as the logger has always printed: `[timestamp] b-ber
// LABEL message`. From log level 3 a line per finished task, and from 4 stack
// traces. The CLI uses it for `--verbose`, `--debug` and `--log-level` 3 and
// up; it is also the default, for anything that drives a build without the
// CLI (a test, a script)
export class LinesReporter implements Reporter {
  private format: Formatter

  constructor(
    private source: ReporterSource,
    private output: Output = process.stdout
  ) {
    this.format = new Formatter(source)
    this.listen('on')
  }

  detach(): void {
    this.listen('off')
  }

  private listen(method: 'on' | 'off'): void {
    const { source } = this
    source[method]('message', this.onMessage)
    source[method]('sequence', this.onSequence)
    source[method]('end', this.onEnd)
    source[method]('done', this.onDone)
    source[method]('exit', this.onExit)
  }

  private get level(): number {
    return this.source.logLevel
  }

  private write(text: string | undefined): void {
    if (text !== undefined) this.output.write(`${text}\n`)
  }

  private onMessage = ({ kind, args, stack }: LogMessage): void => {
    const { format, level } = this

    switch (kind) {
      case 'error':
      case 'warn':
        if (level < LEVEL[kind]) return
        this.write(format.line(kind, format.compose(args)))
        if (level >= LEVEL.verbose) this.write(format.stackFrames(stack))
        return
      case 'notice':
        if (level >= LEVEL.error)
          this.write(format.line('info', format.compose(args)))
        return
      case 'info':
        if (level < LEVEL.verbose) return
        this.write(format.line('info', format.compose(args)))
        if (level >= LEVEL.debug) this.write(format.stackFrames(stack))
        return
      default:
        this.write(format.inspect(args[0]))
    }
  }

  private onSequence = (plan: BuildPlan[]): void => {
    if (this.level < LEVEL.error) return
    const count = plan.reduce((n, build) => n + build.tasks.length, 0)
    const noun = count > 1 ? 'tasks' : 'task'
    this.write(this.format.line('info', `Preparing to run ${count} ${noun}`))
  }

  private onEnd = ({ task, taskTime }: LoggerEvents['end'][0]): void => {
    if (this.level < LEVEL.info) return
    const { format } = this
    this.write(
      format.line('info', `${format.decorate(task)} done (${taskTime.totalMs})`)
    )
  }

  private onDone = (data: DoneEvent): void => {
    if (this.level < LEVEL.error) return
    const { format } = this
    this.write(format.line('info', format.decorate('Build succeeded', 'green')))
    if (this.source.summary)
      for (const line of format.summary(data)) this.write(line)
  }

  private onExit = ({ code }: { code: number }): void => {
    if (this.level < LEVEL.error) return
    this.write(this.format.line('error', `exited with code ${code}`))
  }
}
