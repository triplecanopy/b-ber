'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.configure = configure;
function configure() {
    /*
         0 quiet             show nothing
        1 error             show only errors
        2 warn              show warnings and errors
        3 info              show minimal info
        4 verbose           show all info
        5 debug             show everything
      */

    var logLevel = void 0;
    logLevel = this.settings['log-level'];
    logLevel = this.settings.quiet ? 0 : logLevel;
    logLevel = this.settings.verbose ? 4 : logLevel;
    logLevel = this.settings.debug ? 5 : logLevel;

    this.logLevel = logLevel;

    this.boringOutput = this.settings['no-color'] || this.boringOutput;
    this.summarize = this.settings.summarize || this.summarize;
}