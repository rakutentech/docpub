const _ = require('lodash');
const chalk = require('chalk');

/**
 * Creates actual logger methods for each loggining level.
 * Before calling init, all log methods are _.noop.
 * Accepts single param: opts.verbose. If asked to be verbose, trace level will be enabled,
 * otherwise no.
 *
 * @param  {boolean} opts.verbose - enables verbose output (trace logging level)
 */
exports.setup = function(opts) {
    opts = opts || {};

    function log(msg) {
        console.log(normalize(msg));
    }

    exports.trace = opts.verbose ? log : _.noop;
    exports.info = log;
    exports.warn = msg => console.warn(chalk.yellow(normalize(msg)));
    exports.error = msg => console.error(chalk.red(normalize(msg)));
};

function normalize(msg) {
    return typeof msg === 'string'
        ? msg
        : JSON.stringify(msg);
}

/**
 * Logger supports 4 logging levels: trace, info, warn and error.
 * Before calling setup, log methods are non-functional.
 * Detailed info must be logged using Logger.trace method, so it will not be printed in normal (non-verbose) mode. Output goes to stdout.
 * Regular messages must be logged using Logger.info method. Output goes to stdout.
 * Warnings must be logged with Logger.warn. Warnings will be printed in yellow color. Output goes to stderr.
 * Errors must be logged with Logger.error method. Errors will be printed in red color. Output goes to stderr.
 * Each logging method accepts single argument msg. It can have any type. If type is not string,
 * JSON.stringify will be applied to this arg.
 *
 * @param {any} msg - message to print. If not string, JSON.stringify will be applied to this param.
 */
exports.trace = _.noop;
exports.info = _.noop;
exports.warn = _.noop;
exports.error = _.noop;
