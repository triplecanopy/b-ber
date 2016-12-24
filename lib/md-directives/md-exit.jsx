
/*

@type: exit
@usage: + exit
@output:

*/

import mdInline from '../md-plugins/md-inline'

export default {
  plugin: mdInline,
  name: 'exit',
  renderer: instance => ({
    marker: '+',
    minMarkers: 1,
    validate(params) { return params.trim().match(/^exit/) },
    render() { return '' }
  })
}
