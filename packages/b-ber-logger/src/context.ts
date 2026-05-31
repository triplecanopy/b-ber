import Timer from './Timer'

function ctx(fileName: string): string {
  return fileName
}

export function counter(this: any): string {
  this.incrementCounter()
  return this.decorate(`[${Timer.dateFormat()}]`)
}

export function getContext(this: any): string {
  const { stack } = new Error()
  const message = stack!.split('\n')
  const context = message[3].replace(/^\s+at[^/]+(\/[^:]+):.+$/, (_, m: string) =>
    ctx(m)
  )

  if (context !== this.context) {
    this.context = context
  } else {
    return ''
  }
  return context
}
