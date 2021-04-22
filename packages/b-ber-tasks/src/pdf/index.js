import path from 'path'
import fs from 'fs-extra'
import kebabCase from 'lodash/kebabCase'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import EbookConvert from '@canopycanopycanopy/b-ber-lib/EbookConvert'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const booleans = new Set([
  'pdf_mark_links',
  'preserve_cover_aspect_ratio',
  'pretty_print',
  'uncompressed_pdf',
  'pdf_page_numbers',
  'pdf_add_toc',
  'use_profile_size',
  'disable_font_rescaling',
  'subset_embedded_fonts',
  'embed_all_fonts ',
  'linearize_tables',
  'expand_css',
  'smarten_punctuation',
  'unsmarten_punctuation',
  'insert_blank_line',
  'remove_paragraph_spacing',
  'asciiize',
  'keep_ligatures',
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
  'insert_metadata ',
  'disable_remove_fake_margins',
  'no_chapters_in_toc',
  'use_auto_toc',
  'duplicate_links_in_toc',
])

const settings = new Set([
  'u',
  'unit',
  'm',
  'read_metadata_from_opf',
  'from_opf',
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
])

const toArg = (key, val) => {
  if (typeof val === 'undefined') return `--${kebabCase(key)}`
  return `--${kebabCase(key)}=${val}`
}

const getPDFFlags = options => {
  if (Object.keys(options).length < 1) return []

  const flags = Object.entries(options).reduce((acc, [key, val]) => {
    if (booleans.has(key)) return acc.concat(toArg(key))
    if (settings.has(key)) return acc.concat(toArg(key, val))

    return acc
  }, [])

  return flags
}

const pdf = () => {
  const opsPath = state.dist.ops()
  const inputPath = path.join(opsPath, 'content.opf')

  const pdfOptions = state.config.pdf_options || {}
  const flags = getPDFFlags(pdfOptions)

  // Remove TOC manually since there's no option in
  // ebook-convert to skip it.
  const tocPath = path.join(opsPath, 'toc.xhtml')

  return fs.remove(tocPath).then(() =>
    process.argv.includes('--no-compile')
      ? Promise.resolve()
      : EbookConvert.convert({
          inputPath,
          outputPath: process.cwd(),
          fileType: 'pdf',
          fileName: getBookMetadata('identifier', state),
          flags,
        }).catch(log.error)
  )
}

export default pdf
