import fs from 'fs-extra'
import find from 'lodash/find'
import isPlainObject from 'lodash/isPlainObject'

const YAWN = require('yawn-yaml/cjs')

const interfaces = {
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
        remote_url: { type: 'string', required: false },
        reader_url: { type: 'string', required: false },
        builds: { type: 'array', required: false },
        ui_options: { type: 'object', required: false },
        private: { type: 'boolean', required: false },
        ignore: { type: 'array', required: false },
        autoprefixer_options: { type: 'array', required: false },
        // TODO: fill this in with missing options
    },
}

function YawnAPI() {
    this.yaml = () => ''
    this.json = () => {}
}

const typeCheck = (schema, data = {}) => {
    const errors = []
    if (!interfaces[schema]) errors.push(new Error(`Invalid schema: ${schema}`))
    if (!isPlainObject(data)) {
        errors.push(new Error(`Invalid entry: ${typeof data}`))
    }

    Object.entries(data).forEach(([key, val]) => {
        if (!interfaces[schema][key]) {
            errors.push(
                new Error(
                    `Schema "${schema}" does not support property "${key}"`,
                ),
            )
        }
        if (
            interfaces[schema][key] &&
            interfaces[schema][key].required === true &&
            typeof val === 'undefined'
        ) {
            errors.push(
                new Error(`Schema "${schema}" requires value for"${key}"`),
            )
        }
    })

    if (errors.length) {
        errors.forEach(err => {
            throw err
        })
    }
}

class Yaml {
    data = new YawnAPI()
    schema = ''
    strict = true

    constructor(schema, strict) {
        this.strict = typeof strict !== 'undefined' ? strict : this.strict
        if (this.strict) typeCheck(schema)
        this.schema = schema
    }

    load = file => {
        const data = fs.readFileSync(file, 'utf8')
        this.data = new YAWN(data)
    }

    add = entry => {
        if (this.strict) typeCheck(this.schema, entry)
        this.data.json = [...this.data.json, entry]
    }

    remove = (key, value) => {
        this.data.json = this.data.json.filter(a => a[key] === value)
    }

    update = (key, current, object) => {
        const entry = find(this.data.json, { [key]: current })
        this.remove(key, current)
        this.data.json = [...this.data.json, { ...entry, ...object }]
    }

    yaml = () => this.data.yaml
    json = () => this.data.json
}

export default Yaml
