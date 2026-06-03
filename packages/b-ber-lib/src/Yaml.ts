/* eslint-disable camelcase */

import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import find from 'lodash/find'
import YAWN from 'yawn-yaml/cjs'

interface SchemaField {
  type: string
  required: boolean
}

// TODO set up decoder
const interfaces: Record<string, Record<string, SchemaField>> = {
  metadata: {
    term: { type: 'string', required: true },
    value: { type: 'string', required: true },
    term_property: { type: 'string', required: false },
    term_property_value: { type: 'string', required: false },
  },
  config: {
    env: { type: 'string', required: false },
    src: { type: 'string', required: true },
    dist: { type: 'string', required: true },
    ibooks_specified_fonts: { type: 'boolean', required: false },
    theme: { type: 'string', required: false },
    themes_directory: { type: 'string', required: false },
    base_url: { type: 'string', required: false },
    base_path: { type: 'string', required: false },
    remote_url: { type: 'string', required: false },
    reader_url: { type: 'string', required: false },
    downloads: { type: 'array', required: false },
    ui_options: { type: 'object', required: false },
    private: { type: 'boolean', required: false },
    ignore: { type: 'array', required: false },
    autoprefixer_options: { type: 'object', required: false },
    layout: { type: 'string', required: false },
    group_footnotes: { type: 'boolean', required: false },
    // TODO: fill this in with missing options
  },
  media: {},
}

const typeCheck = (
  schema: string,
  data: Record<string, unknown> = {}
): void => {
  const errors: Error[] = []
  if (!interfaces[schema]) errors.push(new Error(`Invalid schema: ${schema}`))
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push(new Error(`Invalid entry: ${typeof data}`))
  }

  Object.entries(data).forEach(([key, val]) => {
    if (!interfaces[schema]?.[key]) {
      errors.push(
        new Error(`Schema "${schema}" does not support property "${key}"`)
      )
    }
    if (
      interfaces[schema]?.[key] &&
      interfaces[schema][key].required === true &&
      val === undefined
    ) {
      errors.push(new Error(`Schema "${schema}" requires value for"${key}"`))
    }
  })

  if (errors.length) log.error(errors)
}

class Yaml {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: InstanceType<typeof YAWN> = { yaml: '', json: () => ({}) } as any
  schema = ''
  strict = true

  constructor(schema: string, strict?: boolean) {
    this.strict = strict === undefined ? this.strict : strict
    if (this.strict) typeCheck(schema)
    this.schema = schema
  }

  load = (file: string): void => {
    const data = fs.readFileSync(file, 'utf8')
    this.data = new YAWN(data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add = (entry: any): void => {
    if (this.strict) typeCheck(this.schema, entry)
    this.data.json = [...this.data.json, entry]
  }

  remove = (key: string, value: unknown): void => {
    this.data.json = this.data.json.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a[key] === value
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update = (
    key: string,
    current: unknown,
    object: Record<string, any>
  ): void => {
    const entry = find(this.data.json, { [key]: current })
    this.remove(key, current)
    this.data.json = [...this.data.json, { ...entry, ...object }]
  }

  yaml = (): string => this.data.yaml
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json = (): any => this.data.json
}

export default Yaml
