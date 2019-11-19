/* eslint-disable import/prefer-default-export */

import util from 'util'

export function inspect(args) {
  return console.log(util.inspect(args, true, null, true))
}
