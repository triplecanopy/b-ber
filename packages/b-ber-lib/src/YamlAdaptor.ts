import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import yaml from 'js-yaml'

class YamlAdaptor {
  static toYaml(input: unknown): string {
    if (typeof input === 'string') return yaml.safeDump(input)
    if (
      (typeof input === 'object' && input !== null && !Array.isArray(input)) ||
      Array.isArray(input)
    ) {
      return yaml.safeDump(JSON.stringify(input))
    }

    throw new TypeError(`Invalid type: [${typeof input}]`)
  }

  static load(file: string): unknown {
    let data: string | undefined
    try {
      data = fs.readFileSync(file, 'utf-8')
    } catch (err) {
      log.error(err)
    }

    return data ? yaml.safeLoad(data) : []
  }

  static dump(str: unknown): string {
    return yaml.safeDump(str as string | Record<string, unknown> | unknown[], {
      indent: 2,
    })
  }

  static parse(str: string): unknown {
    return yaml.safeLoad(str)
  }
}

export default YamlAdaptor
