import path from 'path'
import crypto from 'crypto'
import { State as state, YamlAdaptor } from '@canopycanopycanopy/b-ber-lib'
import tocYml from './toc.yml'
import metadataYml from './metadata.yml'
import applicationJs from './application.js'
import titlePageMd from './project-name-title-page.md'
import chapterMd from './project-name-chapter-01.md'
import colophonMd from './project-name-colophon.md'
import readmeMd from './README.md'
import gitignoreTxt from './gitignore'

class Project {
  static directories(src: string): string[] {
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

  static relativePath(src: string, ...rest: string[]): string {
    return path.join(path.basename(src), ...rest)
  }

  static absolutePath(src: string, ...rest: string[]): string {
    return path.resolve(path.dirname(src), path.basename(src), ...rest)
  }

  static configYAML(src: string, config: Record<string, any> = {}): { relativePath: string; absolutePath: string; content: string } {
    return {
      relativePath: Project.relativePath(src, '..', 'config.yml'),
      absolutePath: Project.absolutePath(src, '..', 'config.yml'),
      content: YamlAdaptor.dump({ ...(state as any).config, ...config }),
    }
  }

  static tocYAML(src: string): { relativePath: string; absolutePath: string; content: string } {
    return {
      relativePath: Project.relativePath(src, 'toc.yml'),
      absolutePath: Project.absolutePath(src, 'toc.yml'),
      content: tocYml,
    }
  }

  static metadataYAML(src: string): { relativePath: string; absolutePath: string; content: string } {
    return {
      relativePath: Project.relativePath(src, 'metadata.yml'),
      absolutePath: Project.absolutePath(src, 'metadata.yml'),
      content: (metadataYml as string).replace(
        /%IDENTIFIER%/,
        crypto.randomBytes(20).toString('hex')
      ),
    }
  }

  static javascripts(src: string): Array<{ relativePath: string; absolutePath: string; content: string }> {
    return [
      {
        relativePath: Project.relativePath(src, '_javascripts', 'application.js'),
        absolutePath: Project.absolutePath(src, '_javascripts', 'application.js'),
        content: applicationJs,
      },
    ]
  }

  static markdown(src: string): Array<{ relativePath: string; absolutePath: string; content: string }> {
    return [
      {
        relativePath: Project.relativePath(src, '_markdown', 'project-name-title-page.md'),
        absolutePath: Project.absolutePath(src, '_markdown', 'project-name-title-page.md'),
        content: titlePageMd,
      },
      {
        relativePath: Project.relativePath(src, '_markdown', 'project-name-chapter-01.md'),
        absolutePath: Project.absolutePath(src, '_markdown', 'project-name-chapter-01.md'),
        content: chapterMd,
      },
      {
        relativePath: Project.relativePath(src, '_markdown', 'project-name-colophon.md'),
        absolutePath: Project.absolutePath(src, '_markdown', 'project-name-colophon.md'),
        content: colophonMd,
      },
    ]
  }

  static stylesheets(): never[] {
    return []
  }

  static readme(src: string): { relativePath: string; absolutePath: string; content: string } {
    return {
      relativePath: Project.relativePath(src, '..', 'README.md'),
      absolutePath: Project.absolutePath(src, '..', 'README.md'),
      content: (readmeMd as string).replace(/%PROJECT_NAME%/, path.basename(process.cwd())),
    }
  }

  static gitignore(src: string): { relativePath: string; absolutePath: string; content: string } {
    return {
      relativePath: Project.relativePath(src, '..', '.gitignore'),
      absolutePath: Project.absolutePath(src, '..', '.gitignore'),
      content: gitignoreTxt,
    }
  }
}

export default Project
