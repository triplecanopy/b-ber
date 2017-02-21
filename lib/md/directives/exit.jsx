
/*

@type: exit
@usage: + exit
@output:

*/

import inline from '../plugins/inline-block'

export default {
  plugin: inline,
  name: 'exit',
  renderer: () => ({
    marker: '+',
    minMarkers: 1,
    validate(params) { return params.trim().match(/^exit/) },
    render() { return '</section>\n' }
  })
}
