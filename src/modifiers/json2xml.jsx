
// Adapted from https://sites.google.com/site/mynotepad2/developer-notes/javascript/javascript-convert-json-object-to-xml-string

// TODO: depending on where the data is coming from (file structure, YAML
// file, etc), there will need to be a function to create the JSON object that
// Json2XML converts, as well as a function to modify the output based on
// whether it should be XML navpoints or HTML ordered lists

/**
 * Methods to convert JSON objects to XML
 * @namespace
 */
class Json2XML {

  /**
   * Initialize the conversion from JSON to XML
   * @param  {Array<Object>} obj Object to convert
   * @return {String}            The XML string
   */
  static convert(obj) {
    if (Json2XML.isObject(obj) && Json2XML.lengthOf(obj) === 1) {
      for (const a in obj) {
        return Json2XML.toXML(a, obj[a])
      }
    }
  }

  /**
   * Return the number of keys in an object
   * @param  {Object} o
   * @return {Number}
   */
  static lengthOf(o) {
    return Object.keys(o).length
  }

  /**
   * Test if `o` is an `Object`
   * @param  {*}  o Any
   * @return {Boolean}
   */
  static isObject(o) {
    return o && o.constructor === Object && o.toString() === '[object Object]'
  }

  /**
   * Test if `a` is an `Array`
   * @param  {*}  a Any
   * @return {Boolean}
   */
  static isArray(a) {
    return a && a.constructor === Array
  }

  /**
   * Test if `s` is a `String`
   * @param  {*}  s Any
   * @return {Boolean}
   */
  static isString(s) {
    return typeof s === 'string'
  }

  /**
   * Test if `n` is a `Number`
   * @param  {*}  n Any
   * @return {Boolean}
   */
  static isNumber(n) {
    return typeof n === 'number'
  }

  /**
   * Test if `o` is `null` or `undefined`
   * @param  {*}  o Any
   * @return {Boolean}
   */
  static isNullOrUndefined(o) {
    return typeof o === 'undefined' || o === null
  }

  /**
   * Recursively convert a JSON data structure to XML
   * @param  {String} tag The key of an `Object`
   * @param  {*} obj      Any
   * @return {String}
   * @throws {TypeError}  If an unsupported `type` is passed as the second parameter
   */
  static toXML(tag, obj) {
    let doc = `<${tag}`
    if (Json2XML.isNullOrUndefined(obj)) {
      doc += `${doc}/>`
      return doc
    }
    if (Json2XML.isString(obj) || Json2XML.isNumber(obj)) {
      doc += `>${Json2XML.escapeXML(obj)}</${tag}>`
      return doc
    }
    if (Json2XML.isObject(obj)) {
      if (Json2XML.lengthOf(obj) === 0) {
        return `${doc}/>`
      } else {
        doc += '>'
      }

      for (const b in obj) {
        if (Json2XML.isArray(obj[b])) {
          for (let i = 0; i < obj[b].length; i++) { // eslint-disable-line no-plusplus
            if (Json2XML.isNumber(obj[b][i]) || Json2XML.isString(obj[b][i]) || Json2XML.isObject(obj[b][i])) {
              doc += Json2XML.toXML(b, obj[b][i])
            } else {
              throw new TypeError(`${(typeof obj[b][i])} is not supported.`)
            }
          }
        } else if (Json2XML.isNumber(obj[b]) || Json2XML.isString(obj[b]) || Json2XML.isObject(obj[b])) {
          doc += Json2XML.toXML(b, obj[b])
        } else {
          throw new TypeError(`${(typeof obj[b])} is not supported.`)
        }
      }

      doc += `</${tag}>`
      return doc
    }
  }

  static escapeXML(value) {
    return value.toString().replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case '\'': return '&apos;'
        case '"': return '&quot;'
        default: return ''
      }
    })
  }
}


// const data = {data: {
//     type: "folder",
//     name: "animals",
//     path: "/animals",
//     children: [{
//         type: "folder",
//         name: "cat",
//         path: "/animals/cat",
//         children: [{
//             type: "folder",
//             name: "images",
//             path: "/animals/cat/images",
//             children: [{
//                 type: "file",
//                 name: "cat001.jpg",
//                 path: "/animals/cat/images/cat001.jpg"
//             }, {
//                 type: "file",
//                 name: "cat001.jpg",
//                 path: "/animals/cat/images/cat002.jpg"
//             }]
//         }]
//     }]
// }}

export default Json2XML
