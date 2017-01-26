const _ = require('lodash');

/**
 * Basic class for JSON structures parsing\valating.
 * Provides possibility to define key which shall be parsed and indicate whether this key required or not.
 * This class is abstract, in code direct subclasses must be used.
 *
 * @property {string} key - representing property key. By this key source would be queried and resulting value written.
 * @property {boolean} isRequired - is property required. If missing required property in source, exception will be thrown
 */
module.exports = class Parser {
    /**
     * Crate a Parser.
     * You should not instantiate Parser directly. Instead instantiate one of it's subclasses.
     * @param {string} key - property key.
     * @param {boolean} [opts.isRequired] - Indicate is property required. Defaults to false
     *
     * @throws {Error} Will throw error if key is not string or empty
     */
    constructor(key, opts) {
        if (typeof key !== 'string') {
            throw new Error('Key for parsing is not defined');
        }

        if (!key.length) {
            throw new Error('Key for parsing can`t be empty');
        }

        opts = _.defaults(opts || {}, {isRequired: false});

        this.key = key;
        this.isRequired = opts.isRequired;
    }
    /**
     * Abstract method for parsing actual property. Must be redefined in subclasses
     *
     * @throws {Error} always throws `Must be redefined in subclasses` error
     */
    parse() {
        throw new Error('Must be redefined in subclasses');
    }
};
