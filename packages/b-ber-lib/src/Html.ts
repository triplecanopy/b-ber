class Html {
  static comment(str: string): string {
    return `\n<!-- ${str} -->\n`
  }

  static escape(str: unknown): string {
    const str_ = typeof str !== 'string' ? String(str) : str
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return str_.replace(/[&<>"']/g, m => map[m])
  }
}

export default Html
