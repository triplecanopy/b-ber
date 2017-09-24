import util from 'util'
import path from 'path'

function abbrvFilename(filename) {
    return path.basename(path.dirname(filename)) + path.sep + path.basename(filename)
}

export function composeMessage(args) {
    let message = ''
    message = util.format.apply(util, args)
    message = message.replace(/(\/\w+[^\]]+)/, s => abbrvFilename(s))
    message = message.replace(/\{(\d+)\}/, (_, d) => this.floatFormat(d))
    return message
}
