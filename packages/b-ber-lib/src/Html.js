class Html {
  static comment(str) {
    return `\n<!-- ${str} -->\n`
  }

  static escape(str) {
    const str_ = typeof str !== 'string' ? String(str) : str
    const map = {
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
