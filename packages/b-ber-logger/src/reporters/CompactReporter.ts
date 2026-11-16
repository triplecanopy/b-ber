import { performance } from 'node:perf_hooks'
import util from 'node:util'
import { composeMessage, Formatter, formatDuration } from '../format'
import {
  type BuildPlan,
  type DoneEvent,
  LEVEL,
  type LogMessage,
  type Reporter,
  type ReporterSource,
} from '../types'

type Output = Pick<NodeJS.WriteStream, 'write'> & { columns?: number }
type Write = NodeJS.WriteStream['write']

// The braille "dots" spinner, and the frame rate cli-spinners gives it
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const SPINNER_INTERVAL_MS = 80

// Return to the start of the line and clear it
const CLEAR_LINE = '\r\x1b[2K'

// Width to assume when the stream does not report one
const DEFAULT_COLUMNS = 80

interface GroupedWarning {
  args: unknown[]
  count: number
}

// The default output of `bber build`, after the package managers': while the
// build runs, one line that redraws (`⠹ [7/12] render`); when it ends, its
// warnings, each distinct one once with a count, and a line with the result.
// Errors and notices are printed as they happen.
//
// `live: false` is the `plain` reporter, for a stream that is not a terminal
// (a pipe, a CI log). It prints the same, minus the redrawing line, and never
// moves the cursor.
//
// A command that is not a build (`bber new`, `bber serve`) registers no
// sequence, and gets its messages as they happen, as `lines` prints them.
export class CompactReporter implements Reporter {
  private format: Formatter

  private plan: BuildPlan[] | null = null
  private buildIndex = 0
  private taskIndex = 0
  private task: string | null = null
  private runStart = 0
  private buildStart = 0

  // The warnings held back until the build ends, by their plain message
  private warnings = new Map<string, GroupedWarning>()
  private warningCount = 0

  private drawn = false
  private frame = 0
  private spinner: NodeJS.Timeout | null = null

  // While the line is drawn, the streams' own `write`s, which the reporter
  // replaces (see `capture`), and whether what was last written through them
  // ended mid-line
  private originalWrites = new Map<Output, Write>()
  private midLine = false

  // `streams` are the ones `capture` watches while the line is drawn:
  // stdout and stderr, unless a test gives others
  constructor(
    private source: ReporterSource,
    private live: boolean,
    private output: Output = process.stdout,
    private streams: Output[] = [process.stdout, process.stderr]
  ) {
    this.format = new Formatter(source)
    this.listen('on')
  }

  detach(): void {
    this.listen('off')
    this.stopSpinner()
    this.clear()
    this.release()
  }

  private listen(method: 'on' | 'off'): void {
    const { source } = this
    source[method]('message', this.onMessage)
    source[method]('sequence', this.onSequence)
    source[method]('begin', this.onBegin)
    source[method]('done', this.onDone)
    source[method]('exit', this.onExit)
  }

  private get level(): number {
    return this.source.logLevel
  }

  private get building(): boolean {
    return this.plan !== null
  }

  private get multiFormat(): boolean {
    return (this.plan?.length ?? 0) > 1
  }

  private get currentBuild(): BuildPlan | undefined {
    return this.plan?.[this.buildIndex]
  }

  // Output

  // The reporter's own writes, past `capture`
  private write(text: string): void {
    const write = this.originalWrites.get(this.output) ?? this.output.write
    write.call(this.output, text)
  }

  // A line that stays, printed above the redrawing one
  private print(text: string | undefined): void {
    if (text === undefined || this.level < LEVEL.error) return
    this.clear()
    // Finish a line that something else left open
    if (this.midLine) this.write('\n')
    this.midLine = false
    this.write(`${text}\n`)
    this.draw()
  }

  private clear(): void {
    if (!this.drawn) return
    this.write(CLEAR_LINE)
    this.drawn = false
  }

  // Output the reporter does not write still reaches the terminal: a child
  // process's piped through (`zip` and EPUBCheck, by epub-zipper), a library's
  // console.log. Written while the line is drawn it would land on the end of
  // it, and the next redraw would erase it. So while the line is up, every
  // other write to stdout or stderr clears it first, and it is drawn again
  // once that output has ended its line
  private capture(): void {
    if (this.originalWrites.size > 0) return
    for (const stream of this.streams) {
      const original = stream.write
      this.originalWrites.set(stream, original)
      stream.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
        this.clear()
        const result = (original as (...a: unknown[]) => boolean).call(
          stream,
          chunk,
          ...rest
        )
        const text =
          typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString()
        if (text.length > 0) this.midLine = !text.endsWith('\n')
        this.draw()
        return result
      }) as Write
    }
  }

  private release(): void {
    for (const [stream, original] of this.originalWrites)
      stream.write = original
    this.originalWrites.clear()
  }

  // The redrawing line: `⠹ [7/12] render`, and the format first when the
  // build runs more than one
  private draw(): void {
    const build = this.currentBuild
    if (!this.live || !build || this.task === null) return
    if (this.level < LEVEL.error || this.midLine) return
    this.capture()

    const { decorate } = this.format
    const total = String(build.tasks.length)
    const counter = `[${String(this.taskIndex).padStart(total.length)}/${total}]`
    const parts = [SPINNER[this.frame % SPINNER.length], counter]
    if (this.multiFormat) parts.push(build.name)
    parts.push(this.task)

    // A line wider than the terminal wraps, and `\r` then returns only to the
    // start of its last row, so the next redraw would leave the rest behind
    const columns = this.output.columns || DEFAULT_COLUMNS
    while (parts.length > 2 && parts.join(' ').length >= columns) parts.pop()

    const [glyph, count, ...rest] = parts
    const text = [decorate(glyph, 'green'), decorate(count, 'dim'), ...rest]
    this.write(`${CLEAR_LINE}${text.join(' ')}`)
    this.drawn = true
  }

  private startSpinner(): void {
    if (!this.live || this.spinner) return
    this.spinner = setInterval(() => {
      this.frame += 1
      if (this.drawn) this.draw()
    }, SPINNER_INTERVAL_MS)
    // Never what keeps the process alive
    this.spinner.unref()
  }

  private stopSpinner(): void {
    if (this.spinner) clearInterval(this.spinner)
    this.spinner = null
  }

  // Events

  private onMessage = ({ kind, args, stack }: LogMessage): void => {
    const { format, level } = this

    switch (kind) {
      case 'warn':
        if (this.building) {
          this.holdWarning(args)
          return
        }
        if (level >= LEVEL.warn)
          this.print(format.line('warn', format.compose(args)))
        return
      case 'error':
        this.print(format.line('error', format.compose(args)))
        if (level >= LEVEL.verbose) this.print(format.stackFrames(stack))
        return
      case 'notice':
        this.print(format.line('info', format.compose(args)))
        return
      case 'info':
        if (level >= LEVEL.verbose)
          this.print(format.line('info', format.compose(args)))
        return
      default:
        this.print(format.inspect(args[0]))
    }
  }

  private holdWarning(args: unknown[]): void {
    this.warningCount += 1
    const key = composeMessage(args)
    const held = this.warnings.get(key)
    if (held) held.count += 1
    else this.warnings.set(key, { args, count: 1 })
  }

  private onSequence = (plan: BuildPlan[]): void => {
    this.plan = plan
    this.buildIndex = 0
    this.taskIndex = 0
    this.task = null
    this.runStart = performance.now()
    this.buildStart = this.runStart
  }

  private onBegin = ({ task }: { task: unknown }): void => {
    if (this.task === null) this.buildStart = performance.now()
    this.taskIndex += 1
    this.task = util.format(task)
    this.startSpinner()
    this.draw()
  }

  private onDone = (data: DoneEvent): void => {
    const now = performance.now()
    const build = this.currentBuild

    // Not a `bber build`: `bber serve` rebuilds this way
    if (!build) {
      this.task = null
      const name = (data.state as { build?: string })?.build ?? 'project'
      this.result(true, `Built ${name}`, now - this.buildStart)
      this.printSummary(data)
      return
    }

    if (this.multiFormat) {
      const { decorate } = this.format
      const time = formatDuration(now - this.buildStart)
      this.print(
        `${decorate('✓', 'green')} ${build.name} ${decorate(time, 'dim')}`
      )
      this.printSummary(data)
    }

    this.buildIndex += 1
    this.taskIndex = 0
    this.task = null
    if (this.currentBuild) return

    // The last format is done
    const plan = this.plan as BuildPlan[]
    const what = plan.length > 1 ? `${plan.length} formats` : build.name
    this.finish(true, `Built ${what}`, now - this.runStart)
    if (!this.multiFormat) this.printSummary(data)
    this.plan = null
  }

  // The CLI is exiting after a failure
  private onExit = ({ code }: { code: number }): void => {
    const build = this.currentBuild
    if (!build) {
      this.stopSpinner()
      this.print(this.format.line('error', `exited with code ${code}`))
      return
    }

    // Where it stopped: `epub (12/12)`, after the format when there are several
    let where = this.multiFormat ? build.name : ''
    if (this.task) {
      const step = `${this.task} (${this.taskIndex}/${build.tasks.length})`
      where = where ? `${where} › ${step}` : step
    }
    const text = where ? `Build failed at ${where}` : 'Build failed'
    this.finish(false, text, performance.now() - this.runStart, 'after')
    this.plan = null
  }

  // Ends the build's output: the held warnings, then its result
  private finish(ok: boolean, text: string, ms: number, when = 'in'): void {
    this.stopSpinner()
    this.clear()
    this.release()
    this.task = null
    this.printWarnings()
    this.result(ok, text, ms, when)
    this.warnings.clear()
    this.warningCount = 0
  }

  private printWarnings(): void {
    if (this.level < LEVEL.warn) return
    const { format } = this
    for (const { args, count } of this.warnings.values()) {
      const [first, ...rest] = format
        .line('warn', format.compose(args))
        .split('\n')
      // On the first line, where a multi-line warning would bury it
      const times = count > 1 ? ` ${format.decorate(`×${count}`, 'dim')}` : ''
      this.print([`${first}${times}`, ...rest].join('\n'))
    }
  }

  // `✓ Built web in 4.2s · 2 warnings`, or `✗ Build failed at … after 1.5s`
  private result(ok: boolean, text: string, ms: number, when = 'in'): void {
    const { decorate } = this.format
    const glyph = ok ? decorate('✓', 'green') : decorate('✗', 'red')
    let line = `${glyph} ${text} ${when} ${formatDuration(ms)}`

    if (this.warningCount > 0 && this.level >= LEVEL.warn) {
      const noun = this.warningCount > 1 ? 'warnings' : 'warning'
      line += decorate(` · ${this.warningCount} ${noun}`, 'yellow')
    }
    this.print(line)
  }

  private printSummary(data: DoneEvent): void {
    if (!this.source.summary) return
    for (const line of this.format.summary(data)) this.print(line)
  }
}
