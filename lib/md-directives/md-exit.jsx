
/*

@type: exit
@usage: + exit
@output:

*/

import mdInline from '../md-plugins/md-inline-block'

export default {
  plugin: mdInline,
  name: 'exit',
  renderer: () => ({
    marker: '+',
    minMarkers: 1,
    validate(params) { return params.trim().match(/^exit/) },
    render() { return '</section>\n' }
  })
}
