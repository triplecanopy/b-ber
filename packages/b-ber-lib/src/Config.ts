/* eslint-disable camelcase */

import cloneDeep from 'lodash/cloneDeep'
import defaultsDeep from 'lodash/defaultsDeep'

export interface ConfigOptions {
  env: string
  src: string
  dist: string
  cache: boolean
  ibooks_specified_fonts: boolean
  theme: string
  themes_directory: string
  base_url: string
  base_path: string
  remote_url: string
  reader_url: string
  downloads: unknown[]
  ui_options: Record<string, unknown>
  private: boolean
  ignore: unknown[]
  autoprefixer_options: Record<string, unknown>
  layout: string
  group_footnotes: boolean
  [key: string]: unknown
}

class Config {
  defaultOptions: ConfigOptions = {
    env: process.env.NODE_ENV || 'development',
    src: '_project',
    dist: 'project',
    cache: true,
    ibooks_specified_fonts: false,
    theme: 'b-ber-theme-serif',
    themes_directory: './themes',
    base_url: 'http://localhost:4000/project-web',
    base_path: '/',
    remote_url: 'http://localhost:4000/',
    reader_url: 'http://localhost:4000/project-reader',
    downloads: [],
    ui_options: {
      navigation: {
        header_icons: {
          info: true,
          home: true,
          downloads: true,
          toc: true,
        },
        footer_icons: {
          chapter: true,
          page: true,
        },
      },
    },
    private: false,
    ignore: [],
    autoprefixer_options: {
      overrideBrowserslist: ['defaults', '> 1%', 'not dead', 'not IE 11'],
      flexbox: 'no-2009',
    },
    layout: 'columns',
    group_footnotes: true,
  }

  constructor(options: Partial<ConfigOptions> = {}) {
    // lodash.defaultsDeep mutates so we deepclone first
    const defaultOptionsClone = cloneDeep(this.defaultOptions)
    const optionsClone = cloneDeep(options)

    // Config constructor returns a plain object via defaultsDeep rather than a class instance
    return defaultsDeep(optionsClone, defaultOptionsClone) as unknown as Config // TODO: type this
  }
}

export default Config
