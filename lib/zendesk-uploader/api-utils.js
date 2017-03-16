const zendesk = require('node-zendesk');
const ZendeskClientWrapper = require('./client-wrapper');
const constants = require('./constants');

/**
 * Creates and returns a zendesk API client
 *
 * @param {Config} config - global docpub configuraion
 *
 * @returns {Object} instance of the created zendesk API client
 * @throws {Error} Will throw an error if config is missing
 */
const getClient = function(config) {
    if (!config) {
        throw new Error('Unable to configure ZenDesk client without a config');
    }

    const options = {
        username: config.username,
        token: config.token,
        remoteUri: buildHelpCenterUri(config.url),
        helpcenter: true, // In order to use Help Center APIs, this varialbe must be set to `true` AND `remoteUri` must be set to the Help Center endpoint
        disableGlobalState: true // Run as Library only - not scriptrunner
    };
    const client = zendesk.createClient(options);

    return new ZendeskClientWrapper(client);
};

function buildHelpCenterUri(zendeskUrl) {
    // Remove trailing slashes
    return zendeskUrl.replace(/\/*?$/g, '') + constants.HELP_CENTER_ENDPOINT;
}

exports.getClient = getClient;
