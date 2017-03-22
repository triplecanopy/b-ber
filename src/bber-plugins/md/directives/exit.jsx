
/*

@type: exit
@usage: + exit
@output:

*/

import inline from 'bber-plugins/md/plugins/inline-block'

export default {
  plugin: inline,
  name: 'exit',
  renderer: () => ({
    marker: ':',
    minMarkers: 3,
    validate(params) { return params.trim().match(/^exit/) },
    render() { return '</section>\n' }
  })
}
