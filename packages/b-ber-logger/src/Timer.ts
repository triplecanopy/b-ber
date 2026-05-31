import { EventEmitter } from 'events'

interface TaskTime {
  taskName: string
  beginHrtime: [number, number]
  endHrtime: [number, number]
  beginMs: string
  endMs: string
  totalMs: string
}

class Timer extends EventEmitter {
  static dateFormattingOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }

  static timeFormat(t: [number, number]): string {
    const s = t[0] * 1000 + t[1] / 1000000
    return `${String(s).slice(0, -3)}ms`
  }

  static dateFormat(): string {
    return new Date(Date.now()).toLocaleString()
  }

  taskBegin: [number, number] | null = null
  taskEnd: [number, number] | null = null
  sequenceBegin!: [number, number]
  formattedStartDate!: string
  taskTimes!: TaskTime[]

  constructor() {
    super()
    this.prepare()
  }

  prepare(): void {
    this.sequenceBegin = process.hrtime()
    this.formattedStartDate = new Date().toLocaleDateString(
      'en-CA',
      Timer.dateFormattingOptions
    )
    this.taskTimes = []
  }

  start(task: string): void {
    this.taskBegin = process.hrtime(this.sequenceBegin)
    this.emit('begin', { task, begin: this.taskBegin })
  }

  stop(task: string): void {
    this.taskEnd = process.hrtime(this.sequenceBegin)

    const beginMs = Timer.timeFormat(this.taskBegin!)
    const endMs = Timer.timeFormat(this.taskEnd)
    const totalMs = `${(parseFloat(endMs) - parseFloat(beginMs)).toFixed(3)}ms`

    const taskTime: TaskTime = {
      taskName: task,
      beginHrtime: this.taskBegin!,
      endHrtime: this.taskEnd,
      beginMs,
      endMs,
      totalMs,
    }

    this.taskTimes.push(taskTime)
    this.emit('end', { task, taskTime })
  }

  done({ state }: { state: unknown }): void {
    const { taskTimes, formattedStartDate } = this
    const formattedEndDate = new Date().toLocaleDateString(
      'en-CA',
      Timer.dateFormattingOptions
    )
    const sequenceEnd = Timer.timeFormat(process.hrtime(this.sequenceBegin))

    this.emit('done', {
      state,
      taskTimes,
      formattedStartDate,
      formattedEndDate,
      sequenceEnd,
    })
  }
}

export type { TaskTime }
export default Timer
