
import bunyan from 'bunyan'
import bformat from 'bunyan-format'

const formatOut = bformat({ outputMode: 'short' })

const logger = bunyan.createLogger({ name: 'bber', stream: formatOut, level: 'debug' })

export default logger
