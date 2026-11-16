import { performance } from 'node:perf_hooks'

// How long one task took, measured from the start of the run
export interface TaskTime {
  taskName: string
  beginMs: string
  endMs: string
  totalMs: string
}

// What a whole run took, for the summary printed when it ends
export interface RunTime {
  taskTimes: TaskTime[]
  formattedStartDate: string
  formattedEndDate: string
  sequenceEnd: string
}

const dateFormattingOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-CA', dateFormattingOptions)

// Milliseconds to three decimal places, the precision the task lines print
const formatMs = (ms: number): string => `${ms.toFixed(3)}ms`

// Times a run of build tasks. Only measures: the logger decides what to print
// and emits the events
class Timer {
  private runBegin = performance.now()
  private startDate = new Date()
  private taskBegin = this.runBegin
  private taskTimes: TaskTime[] = []

  // Starts timing the next task
  start(): void {
    this.taskBegin = performance.now()
  }

  // Stops timing the current task and records it
  stop(taskName: string): TaskTime {
    const end = performance.now()
    const taskTime: TaskTime = {
      taskName,
      beginMs: formatMs(this.taskBegin - this.runBegin),
      endMs: formatMs(end - this.runBegin),
      totalMs: formatMs(end - this.taskBegin),
    }

    this.taskTimes.push(taskTime)
    return taskTime
  }

  // The whole run so far
  done(): RunTime {
    return {
      taskTimes: [...this.taskTimes],
      formattedStartDate: formatDate(this.startDate),
      formattedEndDate: formatDate(new Date()),
      sequenceEnd: formatMs(performance.now() - this.runBegin),
    }
  }
}

export default Timer
