import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import {
  boolCoreTag,
  CORE_SCHEMA,
  DEFAULT_SCALAR_STYLE_RULES,
  dump,
  floatYaml11Tag,
  intYaml11Tag,
  legacyMapTag,
  load,
  loadAll,
  mergeTag,
  NOT_RESOLVED,
  nullCoreTag,
  omapTag,
  pairsTag,
  SCALAR_STYLE,
  type ScalarLayout,
  type ScalarTagDefinition,
  strTag,
  timestampTag,
} from 'js-yaml'

// b-ber's YAML is written by authors (config.yml, toc.yml, metadata.yml, front
// matter) and was read for years by js-yaml 3. js-yaml 5 defaults to the YAML
// 1.2 core schema, which reads some of those files differently: dates become
// strings, `<<` merges stop working, `0123` is decimal. This schema resolves
// plain scalars the way js-yaml 3's default safe schema did, so existing books
// mean the same thing. It is verified value-for-value against js-yaml 3 in
// __tests__/yaml-adaptor.test.js (TASK-140).
//
// Not carried over: `!!binary` and `!!set` (js-yaml 5 builds a Uint8Array and a
// Set where 3 built a Buffer and an object, so they now fail loudly instead of
// differing quietly), and js-yaml 3's leniency with tab indentation, empty flow
// entries and impossible dates, which 5 rejects or leaves as strings.

// js-yaml 3's float pattern. YAML 1.1's requires a signed exponent and allows
// leading zeros; the core schema's allows leading zeros; js-yaml 3 did neither.
const V3_FLOAT =
  /^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/

const floatV3Tag: ScalarTagDefinition<number> = {
  ...floatYaml11Tag,
  resolve: (source) => {
    if (!V3_FLOAT.test(source) || source.endsWith('_')) return NOT_RESOLVED

    let value = source.replace(/_/g, '').toLowerCase()
    const sign = value[0] === '-' ? -1 : 1
    if (value[0] === '-' || value[0] === '+') value = value.slice(1)

    if (value === '.inf') return sign * Number.POSITIVE_INFINITY
    if (value === '.nan') return Number.NaN

    // Sexagesimal, e.g. 190:20:30.15
    if (value.includes(':')) {
      return (
        sign *
        value.split(':').reduce((acc, part) => acc * 60 + parseFloat(part), 0)
      )
    }

    return sign * parseFloat(value)
  },
}

// YAML 1.1 ints (legacy octal, binary, sexagesimal, underscores), except that
// js-yaml 3 rejected a trailing underscore and never produced -0.
const intV3Tag: ScalarTagDefinition<number> = {
  ...intYaml11Tag,
  resolve: (source, isExplicit, tagName) => {
    if (source.endsWith('_')) return NOT_RESOLVED
    const value = intYaml11Tag.resolve(source, isExplicit, tagName)
    return value === 0 ? 0 : value
  },
}

const schema = CORE_SCHEMA.withTags(
  boolCoreTag,
  nullCoreTag,
  intV3Tag,
  floatV3Tag,
  timestampTag,
  mergeTag,
  omapTag,
  pairsTag,
  legacyMapTag
)

// js-yaml 3 single-quoted any string containing a flow indicator, `:` or `#`,
// and a string of only spaces; js-yaml 5 leaves the first plain where it can
// and double-quotes the second. Both read back the same, but b-ber rewrites
// users' config.yml (`bber theme set`) and writes new ones (`bber new`), so
// keep the text identical to what it has always been.
const quoteLikeV3 = (layout: ScalarLayout): void => {
  if (layout.node.tag !== strTag.tagName) return
  const { value } = layout.node

  if (layout.style === SCALAR_STYLE.PLAIN && /[,[\]{}:#]/.test(value)) {
    layout.style = SCALAR_STYLE.SINGLE_QUOTED
  } else if (
    layout.style === SCALAR_STYLE.DOUBLE_QUOTED &&
    /^ +$/.test(value)
  ) {
    layout.style = SCALAR_STYLE.SINGLE_QUOTED
  }
}

const scalarStyleRules = [
  ...Object.values(DEFAULT_SCALAR_STYLE_RULES),
  quoteLikeV3,
]

const toYamlString = (input: unknown): string =>
  dump(input, { indent: 2, scalarStyleRules })

class YamlAdaptor {
  static toYaml(input: unknown): string {
    if (typeof input === 'string') return toYamlString(input)
    if (
      (typeof input === 'object' && input !== null && !Array.isArray(input)) ||
      Array.isArray(input)
    ) {
      return toYamlString(JSON.stringify(input))
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

    return data ? YamlAdaptor.parse(data) : []
  }

  static dump(str: unknown): string {
    return toYamlString(str)
  }

  static parse(str: string): unknown {
    // js-yaml 5's load() throws on a stream with no document (empty, or only
    // comments). js-yaml 3 returned nothing, and an empty front matter block
    // arrives here as ''.
    const documents = loadAll(str, { schema })
    if (documents.length === 0) return undefined
    if (documents.length === 1) return documents[0]

    // Let load() raise its own "expected a single document" error
    return load(str, { schema })
  }
}

export default YamlAdaptor
