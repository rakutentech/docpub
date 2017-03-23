const configParser = require('gemini-configparser');

const root = configParser.root;
const section = configParser.section;
const option = configParser.option;

const shouldBeString = require('../metadata/validation-utils').shouldBeString;

const ENV_PREFIX = `${require('../../package').name}_`;

/**
 * Parsing scheme for the config. Determines config structure.
 * Raw values parsing process:
 * 1. Override JSON values with CLI and ENV variables
 * 2. Ensure requred fields presented
 * 3. Validate values
 * 4. Map values
 * Current structure:
 * ```
 * {
 *     username: string, required,
 *     token: string, required,
 *     url: string, required
 * }
 * ```
 */
module.exports = root(
    section({
        username: option({
            validate: shouldBeString
        }),

        token: option({
            validate: shouldBeString
        }),

        url: option({
            validate: shouldBeString
        })
    }), {envPrefix: ENV_PREFIX}); // docpub-specific env variables prefix
