/* eslint-disable import/prefer-default-export*/
const fail = (msg, err, yargs) => {
    yargs.showHelp()
    process.exit(0)
}

export { fail }
