class DOM {
    static getPostionLeftFromMatrix(elem) {
        if (!elem || !elem.nodeType || elem.nodeType < 1) {
            console.warn(`DOM#getPostionLeftFromMatrix requires a valid DOM element; ${typeof elem} provided`)
            return null
        }

        const matrix = window
            .getComputedStyle(elem)
            .transform.replace(/(matrix\(|\))/, '')
            .split(',')
            .map(a => Number(a.trim()))

        return matrix[4]
    }
}

export default DOM
