import util from 'node:util'

export function inspect(_args: unknown): void {
  console.log(util.inspect(_args, true, null, true))
}
