/* eslint-disable camelcase */

import defaultsDeep from 'lodash/defaultsDeep'
import cloneDeep from 'lodash/cloneDeep'

class Config {
    defaultOptions = {
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
            overrideBrowserslist: ['last 2 versions', '> 2%'],
            flexbox: 'no-2009',
        },
    }

    constructor(options = {}) {
        // lodash.defaultsDeep mutates so we deepclone first
        const defaultOptionsClone = cloneDeep(this.defaultOptions)
        const optionsClone = cloneDeep(options)

        return defaultsDeep(optionsClone, defaultOptionsClone)
    }
}

export default Config
