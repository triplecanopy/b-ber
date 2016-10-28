
import winston from 'winston'

winston.emitErrs = true

const logger = new winston.Logger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: './.log/winston.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false
    }),
    new winston.transports.Console({
      level: 'debug', // levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
      handleExceptions: true,
      json: false,
      colorize: true
    })
  ],
  exitOnError: false
})

export default logger
