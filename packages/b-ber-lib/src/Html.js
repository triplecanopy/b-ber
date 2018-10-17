class Html {
    static comment(str) {
        return `\n<!-- ${str} -->\n`
    }

    static escape(str) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }
        return str.replace(/[&<>"']/g, m => map[m])
    }

    static pagebreakAttribute({ pagebreak }) {
        if (!pagebreak || typeof pagebreak !== 'string') return ''
        switch (pagebreak) {
            case 'before':
            case 'after':
                return ` style="page-break-${pagebreak}:always;"`
            case 'both':
                return ` style="page-break-before:always; page-break-after:always;"`
            default:
                return ''
        }
    }
}

export default Html
