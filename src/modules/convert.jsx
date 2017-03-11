
// Adapted from https://sites.google.com/site/mynotepad2/developer-notes/javascript/javascript-convert-json-object-to-xml-string

// TODO: depending on where the data is coming from (file structure, YAML
// file, etc), there will need to be a function to create the JSON object that
// Json2XML converts, as well as a function to modify the output based on
// whether it should be XML navpoints or HTML ordered lists

class Json2XML {

  static convert(obj) {
    if (Json2XML.isObject(obj) && Json2XML.lengthOf(obj) === 1) {
      for (var a in obj) {
        return Json2XML.toXML(a, obj[a])
      }
    }
  }

  static lengthOf(o) {
    return Object.keys(o).length
  }

  static isObject(o) {
    return o && o.constructor === Object && o.toString() === '[object Object]'
  }

  static isArray(a) {
    return a && a.constructor === Array
  }

  static isString(s) {
    return typeof s === 'string'
  }

  static isNumber(n) {
    return typeof n === 'number'
  }

  static isNullOrUndefined(o) {
    return typeof o === 'undefined' || o === null
  }

  static toXML(tag, obj) {
    var doc = `<${tag}`
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

      for (var b in obj) {
        if (Json2XML.isArray(obj[b])) {
          for (var i = 0; i < obj[b].length; i++) {
            if (Json2XML.isNumber(obj[b][i]) || Json2XML.isString(obj[b][i]) || Json2XML.isObject(obj[b][i])) {
              doc += Json2XML.toXML(b, obj[b][i])
            } else {
              throw new Error((typeof obj[b][i]) + ' is not supported.')
            }
          }
        } else if (Json2XML.isNumber(obj[b]) || Json2XML.isString(obj[b]) || Json2XML.isObject(obj[b])) {
          doc += Json2XML.toXML(b, obj[b])
        } else {
          throw new Error((typeof obj[b]) + ' is not supported.')
        }
      }

      doc += `</${tag}>`
      return doc
    }
  }

  static escapeXML(value) {
    return value.toString().replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    })
  }
}


// const data = [{
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
// }]


