export function configure() {
    /*

        0 quiet             show nothing
        1 info              show some info
        2 verbose           show all info
        3 warn              show warnings and errors
        4 error             show only errors
        5 debug             show everything

     */

    let logLevel
    logLevel = this.settings['log-level']
    logLevel = this.settings.quiet ? 0 : logLevel
    logLevel = this.settings.verbose ? 2 : logLevel

    this.logLevel = logLevel

    this.boringOutput = this.settings['no-color'] || this.boringOutput
    this.summarize = this.settings.summarize || this.summarize

}
