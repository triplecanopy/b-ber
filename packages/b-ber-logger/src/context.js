import Timer from './Timer'

function ctx(filename) {
    return filename
    // return path.basename(path.dirname(filename)) + path.sep + path.basename(filename, path.extname(filename))
}

export function counter() {
    this.incrementCounter()
    return this.decorate(`[${Timer.dateFormat()}]`)
}
export function getContext() {
    const { stack } = new Error()
    const message = stack.split('\n')
    const context = message[3].replace(/^\s+at[^/]+(\/[^:]+):.+$/, (_, m) => ctx(m))

    if (context !== this.context) {
        this.context = context
    } else {
        return ''
    }
    return context
}
