import React from 'react'
import ConnectedApp from '.'

render(
  <ConnectedApp props={window.__SERVER_DATA__ || {}} />,
  document.getElementById('root')
)
