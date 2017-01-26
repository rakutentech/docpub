const _ = require('lodash');
const Parser = require('./parser');

/**
 * Class representing non-object property in JSON.
 *
 * Provides possiblity to validate property by passing validation function in optons.
 * Validation function must accept single param - value itself. If validation failed,
 * validation function must throw a meaningful error. If no error thrown, validation considered as successful.
 *
 * Provides possibility to map property value by passing mapping function in options.
 * Mapping function must accept single param - value itself and return new value. If no value returned from mapping function,
 * resulting value will be undefined.
 *
 * Provides possibility to specify default value for property if it is missing in source JSON.
 * As missing considered property with value === undefined.
 *
 * @property {string} key - representing property key.
 * @property {boolean} isRequired - is property required.
 */
module.exports = class Property extends Parser {
    /**
     * Create a Property parser.
     * @param {string} key - property key.
     * @param {boolean} [opts.isRequired] - Indicate is property required. Defaults to false
     * @param {boolean} [opts.defaultValue] - Default value, if value is missing in source. Defaults to undefined
     * @param {boolean} [opts.validate] - Validation function for property. Defaults to _.noop
     * @param {boolean} [opts.isRequired] - Indicate is property required. Defaults to _.identity
     */
    constructor(key, opts) {
        super(key, opts);

        opts = _.defaults(opts || {}, {
            map: _.identity,
            validate: _.noop,
            defaultValue: undefined
        });

        if (typeof opts.map !== 'function') {
            throw new Error('Mapper is not a function');
        }

        if (typeof opts.validate !== 'function') {
            throw new Error('Validator is not a function');
        }

        this._map = opts.map;
        this._validate = opts.validate;
        this._defaultValue = opts.defaultValue;
    }

    /**
     * Parses the non-object property.
     * If value is not specified, tries to use default value.
     * If both value and default value are not specified, throws an error.
     * Parsing order is following:
     * 1. Validate
     * 2. Map
     * 3. Return mapping result
     * Please note, that validate and map will be applied for default value also as for regular value
     *
     * @param {*} value - value to parse
     *
     * @throws {Error} Throws error if both value and default value are undefined
     * @throws {Error} Throws error if validation failed
     *
     * @returns {*} result of the parsing
     */
    parse(value) {
        value = value || this._defaultValue;

        if (value === undefined) {
            throw new Error(`Missing option ${this.key}`);
        }

        this._validate(value);
        return this._map(value);
    }
};
