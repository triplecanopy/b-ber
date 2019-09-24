import path from 'path'
import crypto from 'crypto'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'

class Project {
    static directories(src) {
        return [
            `${src}/_images`,
            `${src}/_javascripts`,
            `${src}/_stylesheets`,
            `${src}/_markdown`,
            `${src}/_fonts`,
            `${src}/_media`,
            `${src}/.tmp`,
        ]
    }

    static relativePath(src, ...rest) {
        return path.join(path.basename(src), ...rest)
    }

    static absolutePath(src, ...rest) {
        return path.resolve(path.dirname(src), path.basename(src), ...rest)
    }

    static configYAML(src) {
        return {
            relativePath: Project.relativePath(src, '..', 'config.yml'),
            absolutePath: Project.absolutePath(src, '..', 'config.yml'),
            content: YamlAdaptor.dump(state.config),
        }
    }

    static tocYAML(src) {
        return {
            relativePath: Project.relativePath(src, 'toc.yml'),
            absolutePath: Project.absolutePath(src, 'toc.yml'),
            // eslint-disable-next-line global-require
            content: require('./toc.yml.js'),
        }
    }

    static metadataYAML(src) {
        return {
            relativePath: Project.relativePath(src, 'metadata.yml'),
            absolutePath: Project.absolutePath(src, 'metadata.yml'),
            // eslint-disable-next-line global-require
            content: require('./metadata.yml.js').replace(/%IDENTIFIER%/, crypto.randomBytes(20).toString('hex')),
        }
    }

    static javascripts(src) {
        return [
            {
                relativePath: Project.relativePath(src, '_javascripts', 'application.js'),
                absolutePath: Project.absolutePath(src, '_javascripts', 'application.js'),
                // eslint-disable-next-line global-require
                content: require('./application.js.js'),
            },
        ]
    }

    static markdown(src) {
        return [
            {
                relativePath: Project.relativePath(src, '_markdown', 'project-name-title-page.md'),
                absolutePath: Project.absolutePath(src, '_markdown', 'project-name-title-page.md'),
                // eslint-disable-next-line global-require
                content: require('./project-name-title-page.md.js'),
            },
            {
                relativePath: Project.relativePath(src, '_markdown', 'project-name-chapter-01.md'),
                absolutePath: Project.absolutePath(src, '_markdown', 'project-name-chapter-01.md'),
                // eslint-disable-next-line global-require
                content: require('./project-name-chapter-01.md.js'),
            },
            {
                relativePath: Project.relativePath(src, '_markdown', 'project-name-colophon.md'),
                absolutePath: Project.absolutePath(src, '_markdown', 'project-name-colophon.md'),
                // eslint-disable-next-line global-require
                content: require('./project-name-colophon.md.js'),
            },
        ]
    }

    static stylesheets() {
        return []
    }

    static readme(src) {
        return {
            relativePath: Project.relativePath(src, '..', 'README.md'),
            absolutePath: Project.absolutePath(src, '..', 'README.md'),
            // eslint-disable-next-line global-require
            content: require('./README.md.js').replace(/%PROJECT_NAME%/, path.basename(process.cwd())),
        }
    }

    static gitignore(src) {
        return {
            relativePath: Project.relativePath(src, '..', '.gitignore'),
            absolutePath: Project.absolutePath(src, '..', '.gitignore'),
            // eslint-disable-next-line global-require
            content: require('./.gitignore.js'),
        }
    }
}

export default Project
