const _ = require('lodash');
const Parser = require('./parser');

/**
 * Name of the special key which indicates that dictionary is a root for JSON parsing
 * @type {String}
 */
const ROOT_NAME = 'ROOT';

/**
 * Class representing object property in JSON.
 * Must also be used as a root when describing JSON structure
 *
 * JSON has to be described as a set of parsers (Property/Dictionary).
 *
 * @property {string} key - representing property key. For root object will be ignored.
 * @property {boolean} isRequired - is property required.
 */
module.exports = class Dictionary extends Parser {
    /**
     * Creates new dictionary which has to be used as root for JSON parsing.
     * It's key property always set to ROOT constant
     *
     * @param {Parser|Parser[]} parsers - parsers which will describe JSON
     *
     * @throws {Error} Will throw error if any of parsers is not instanceof Parser
     *
     * @returns {Dictionary} dictionary initialised with parsers
     */
    static createRoot(parsers) {
        return new Dictionary(ROOT_NAME, parsers);
    }

    /**
     * Crate a Dictionary parser.
     * @param {string} key - property key. For root, expected to pass `ROOT`.
     * @param {Parser|Parser[]} parsers set of parsers rescribing JSON structure. Single parser may passed as value, not as array
     * @param {boolean} [opts.isRequired] - Indicate is property required. Defaults to false
     *
     * @throws {Error} Will throw error if key is not string or empty
     * @throws {Error} Will throw error if any of parsers is not instanceof Parser
     */
    constructor(key, parsers, opts) {
        super(key, opts);

        if (!parsers) {
            throw new Error('Section must be initialized with at least 1 parser');
        }

        parsers = [].concat(parsers);
        parsers.forEach(parser => {
            if (!(parser instanceof Parser)) {
                throw new Error('Each parser must be inherited from `Parser` class');
            }
        });

        this._parsers = parsers;
    }

    /**
     * Returns name of ROOT dictionary. Actual string value is 'ROOT'
     */
    get isRoot() {
        return this.key === ROOT_NAME;
    }

    /**
     * Returns all top-level keys of the Dictionary
     *
     * @returns {string[]} - top-level keys
     */
    getAllKeys() {
        return this._parsers.map(parser => parser.key);
    }

    /**
     * Parses the object property.
     * First checks, are there any unexpected keys in JSON by comparing set of keys defined in parsers
     * with objects's properties. If founds any keys not described by parsers, throws an error.
     * Next checks, are all required keys present. If not, throws an error.
     * Next, applies all parsers for values described by parsers keys and writes result by same key.
     *
     * @param {Object} json - json to parse
     *
     * @throws {Error} Throws error if found unexpected keys in JSON
     * @throws {Error} Throws error if required keys are missing in JSON
     *
     * @returns {Object} result of the parsing
     */
    parse(json) {
        this._checkUnexpectedKeys(json);
        this._checkRequiredKeys(json);

        return this._parsers.reduce((result, parser) => {
            result[parser.key] = parser.parse(json[parser.key]);

            return result;
        }, {});
    }

    _checkUnexpectedKeys(json) {
        const keys = _.keys(json);
        const expectedKeys = _.map(this._parsers, 'key');
        const difference = _.difference(keys, expectedKeys);

        if (difference.length > 0) {
            throw new Error(`Unknown keys: [${difference.join(', ')}] in json: ${JSON.stringify(json, null, 4)}`);
        }
    }

    _checkRequiredKeys(json) {
        const keys = _.keys(json);
        const requiredKeys = _(this._parsers)
            .filter('isRequired')
            .map('key')
            .value();

        requiredKeys.forEach(required => {
            if (!_.includes(keys, required)) {
                throw new Error(`Missing required key '${required}' keys in json: ${JSON.stringify(json, null, 4)}`);
            }
        });
    }
};
