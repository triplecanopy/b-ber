/* eslint-disable import/prefer-default-export */

export const parseArgs = args => {
    const result = {}
    let args_

    args_ = args.slice(2)
    args_ = args_.map(a => a.split(/^--(\w+)\s/).filter(Boolean))
    args_.forEach(a => (result[a[0]] = a[1] || true))
    return result
}
