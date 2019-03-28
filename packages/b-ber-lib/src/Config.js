/* eslint-disable camelcase */

class Config {
    constructor(options = {}) {
        const defaults = {
            env: process.env.NODE_ENV || 'development',
            src: '_project',
            dist: 'project',
            ibooks_specified_fonts: false,
            theme: 'b-ber-theme-serif',
            themes_directory: './themes',
            base_url: '/',
            remote_url: 'http://localhost:4000/',
            reader_url: 'http://localhost:4000/project-reader',
            builds: ['epub', 'mobi', 'pdf'],
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
                browsers: ['last 2 versions', '> 2%'],
                flexbox: 'no-2009',
            },
        }

        return { ...defaults, ...options }
    }
}

export default Config