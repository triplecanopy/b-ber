
/*

@type: logo
@usage: + logo
@output: <figure> ... </figure>

*/

import inlineBlock from '../plugins/inline-block'

export default {
  plugin: inlineBlock,
  name: 'logo',
  renderer: () => ({
    marker: '+',
    minMarkers: 1,
    render() {
      return `<figure id="Triple-Canopy" class="logo">
        <img style="width:120px;" alt="Triple Canopy Logo" src="../images/Triple-Canopy-Logo-Small.png"/>
      </figure>
      <p>155 Freeman Street<br/>Brooklyn, New York 11222<br/><a href="https://www.canopycanopycanopy.com">canopycanopycanopy.com</a></p>`
    }
  })
}
