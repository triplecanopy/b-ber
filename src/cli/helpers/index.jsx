
const fail = (msg, err, yargs) => {
  console.log(msg)
  yargs.showHelp()
  if (process.argv.indexOf('-v') > 0 || process.argv.indexOf('--verbose') > 0) {
    console.log(err.stack)
  }
  process.exit(0)
}

export { fail }
