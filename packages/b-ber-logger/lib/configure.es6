export function configure() {
    /*

        0 quiet             show nothing
        1 info              show some info
        2 verbose           show all info
        3 warn              show warnings and errors
        4 error             show only errors
        5 debug             show everything

     */


    this.logLevel = this.settings['log-level']
        ? this.settings['log-level']
        : this.settings.verbose
        ? 2
        : this.settings.quiet
        ? 0
        : this.logLevel


    this.boringOutput = this.settings['no-color'] || this.boringOutput

}
