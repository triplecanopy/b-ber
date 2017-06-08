
import bunyan from 'bunyan'
import bformat from 'bunyan-format'
// import util from 'util'

const formatOut = bformat({ outputMode: 'short' })

// "fatal" (60), "error" (50), "warn" (40), "info" (30), "debug" (20), "trace" (10)
const log = bunyan.createLogger({ name: 'bber', stream: formatOut, level: 'debug' })
// const logg = data => console.log(util.inspect(data, false, null, true))

export default log
// export { log, logg }
