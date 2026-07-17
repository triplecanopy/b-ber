import React from 'react'

interface MediaTimeProps {
  time?: string
}

function MediaTime({ time }: MediaTimeProps) {
  return <div className="bber-media__time">{time}</div>
}

export default MediaTime
