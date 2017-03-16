const configParser = require('gemini-configparser');

const root = configParser.root;
const section = configParser.section;
const option = configParser.option;

const shouldBeString = require('../metadata/validation-utils').shouldBeString;

const ENV_PREFIX = `${require('../../package').name}_`;

module.exports = root(
    section({
        username: option({
            validate: shouldBeString
        }),

        apiToken: option({
            validate: shouldBeString
        }),

        url: option({
            validate: shouldBeString
        })
    }), {envPrefix: ENV_PREFIX});
