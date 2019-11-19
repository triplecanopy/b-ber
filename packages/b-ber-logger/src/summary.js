/* eslint-disable import/prefer-default-export */

import util from 'util'
import isPlainObject from 'lodash.isplainobject'

const INDENTATION = '  '

function write(msgs, context) {
  const len = msgs.length - 1
  const esses = ' %s'.repeat(len)
  const msgs_ = msgs.map(([text, color]) => context.decorate(text, color))

  const message = util.format.call(
    util,
    `%s%s %s${esses}`,
    context.indent(),
    context.decorate('b-ber', 'whiteBright', 'bgBlack'),
    ...msgs_
  )
  process.stdout.write(message)
  context.newLine()
}

function printNavigation(data, context, indent = 0) {
  const indent_ = INDENTATION.repeat(indent)
  function render(_data, _context) {
    _data.forEach(item => {
      write(
        [[`${indent_}${item.title || '[no title]'}: ${item.name}`]],
        _context
      )

      if (item.nodes && item.nodes.length) {
        render(item.nodes, _context)
      }
    })
  }

  render(data, context)
}

function writeMetadata(data, context) {
  Object.entries(data).forEach(([, v]) => {
    if (isPlainObject(v)) {
      write([[`${v.term}: ${v.value}`]], context)
    }
  })
}

function writeConfig(data, context, indent = 0) {
  const indent_ = INDENTATION.repeat(indent)
  Object.entries(data).forEach(([k, v]) => {
    if (typeof v === 'string') {
      write([[`${indent_}${k}: ${v}`]], context)
    }

    if (isPlainObject(v)) {
      write([[`${indent_}${k}`]], context)
      writeConfig(v, context, indent + 1)
    }
  })
}

export function printSummary({
  state,
  formattedStartDate,
  formattedEndDate,
  sequenceEnd,
}) {
  this.newLine()
  write([['Stats', 'blueBright']], this)
  write([['Build Start:'], [formattedStartDate]], this)
  write([['Build End:'], [formattedEndDate]], this)
  write([['Elapsed:'], [sequenceEnd]], this)

  this.newLine()
  write([['Configuration', 'blueBright']], this)
  writeConfig(state.config, this)

  this.newLine()
  write([['Metadata', 'blueBright']], this)
  writeMetadata(state.metadata.json(), this)

  this.newLine()
  write([['Navigation', 'blueBright']], this)

  printNavigation(state.toc, this)
}
