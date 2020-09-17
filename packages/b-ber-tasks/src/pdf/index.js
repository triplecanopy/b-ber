import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import EbookConvert from '@canopycanopycanopy/b-ber-lib/EbookConvert'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'
import { isBoolean, isPlainObject } from 'lodash'

const yamlFormattedAliases = new Map([
  ['u', 'unit'],
  ['m', 'read_metadata_from_opf'],
  ['from_opf', 'read_metadata_from_opf'],
])

const yamlFormattedBooleans = new Set([
  'preserve_cover_aspect_ratio',
  'disable_font_rescaling',
  'subset_embedded_fonts',
  'smarten_punctuation',
  'unsmarten_punctuation',
  'insert_blank_line',
  'remove_paragraph_spacing',
  'enable_heuristics',
  'disable_markup_chapter_headings',
  'disable_italicize_common_cases',
  'disable_fix_indents',
  'disable_unwrap_lines',
  'disable_delete_blank_paragraphs',
  'disable_format_scene_breaks',
  'disable_dehyphenate',
  'disable_renumber_headings',
  'prefer_metadata_cover',
  'remove_first_image',
  'disable_remove_fake_margins',
  'no_chapters_in_toc',
  'duplicate_links_in_toc',
])

const yamlFormattedPairs = new Set([
  'custom_size',
  'pdf_standard_font',
  'pdf_page_margin_top',
  'pdf_page_margin_right',
  'toc_title',
  'pdf_serif_family',
  'pdf_mono_font_size',
  'pdf_page_margin_left',
  'pdf_page_margin_bottom',
  'pdf_footer_template',
  'pdf_default_font_size',
  'pdf_sans_family',
  'pdf_mono_family',
  'unit',
  'paper_size',
  'pdf_header_template',
  'base_font_size',
  'font_size_mapping',
  'embed_font_family',
  'line_height',
  'minimum_line_height',
  'extra_css',
  'filter_css',
  'transform_css_rules',
  'margin_top',
  'margin_left',
  'margin_right',
  'margin_bottom',
  'change_justification',
  'insert_blank_line_size',
  'remove_paragraph_spacing_indent_size',
  'html_unwrap_factor',
  'replace_scene_breaks',
  'sr1_search',
  'sr1_replace',
  'sr2_search',
  'sr2_replace',
  'sr3_search',
  'sr3_replace',
  'search_replace',
  'chapter',
  'chapter_mark',
  'page_breaks_before',
  'start_reading_at',
  'level1_toc',
  'level2_toc',
  'level3_toc',
  'toc_threshold',
  'max_toc_links',
  'toc_filter',
  'title',
  'authors',
  'title_sort',
  'author_sort',
  'cover',
  'comments',
  'publisher',
  'series',
  'series_index',
  'rating',
  'isbn',
  'tags',
  'book_producer',
  'language',
  'pubdate',
  'timestamp',
  'read_metadata_from_opf',
  'from_opf',
])

const convertKeyToFlag = value => `--${value.replace(/_/g, '-')}`

const getFlags = options => {
  if (!isPlainObject(options) || Object.keys(options).length < 1) {
    return []
  }

  const flags = Object.entries(options).reduce((acc, [key, val]) => {
    let nextKey = key
    let nextVal = val
    let flag = ''

    if (yamlFormattedAliases.has(nextKey)) {
      nextKey = yamlFormattedAliases.get(nextKey) // Account for single hyphen for aliases
    }

    if (yamlFormattedBooleans.has(nextKey)) {
      if (!isBoolean(nextVal)) {
        log.warn(
          'The value for boolean ebook-convert option `%s` must be `true` or `false`',
          nextKey
        )
        return acc
      }

      if (val !== true) {
        log.warn(
          'The value for boolean ebook-convert option `%s` is set to `false`, and will be ignored',
          nextKey
        )
        return acc
      }

      nextKey = convertKeyToFlag(nextKey)
      flag = nextKey
    } else if (yamlFormattedPairs.has(nextKey)) {
      nextKey = convertKeyToFlag(nextKey)
      nextVal = String(nextVal).trim()
      flag = `${nextKey}=${nextVal}`
    }

    if (!flag) return acc

    return acc.concat(flag)
  }, [])

  return flags
}

const pdf = () => {
  const opsPath = state.dist.ops()
  const inputPath = path.join(opsPath, 'content.opf')
  const outputPath = process.cwd()
  const fileName = getBookMetadata('identifier', state)
  const fileType = 'pdf'
  const flags = getFlags(state.config.pdf_options)

  // TODO: remove TOC manually since we don't have the option in
  // ebook-convert to skip it. should probably be done elsewhere
  // @issue: https://github.com/triplecanopy/b-ber/issues/230
  const tocPath = path.join(opsPath, 'toc.xhtml')

  return fs.remove(tocPath).then(() => {
    if (process.argv.includes('--no-compile')) {
      return Promise.resolve()
    }

    return EbookConvert.convert({
      inputPath,
      outputPath,
      fileType,
      fileName,
      flags,
    }).catch(log.error)
  })
}

export default pdf
