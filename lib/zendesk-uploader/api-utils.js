const zendesk = require('node-zendesk');
const ZendeskClientWrapper = require('./client-wrapper');
const constants = require('./constants');

/**
 * Creates and returns a zendesk API client
 * @returns {Object} instance of the created zendesk API client
 * @throws {Error} Will throw an error if the environment variables for the api client are not set
 */
const getClient = function() {
    if (!process.env.ZENDESK_API_USERNAME) {
        throw (new Error('Environment variable for Zendesk Username is undefined'));
    }
    if (!process.env.ZENDESK_API_TOKEN) {
        throw (new Error('Environment variable for Zendesk Token is undefined'));
    }
    if (!process.env.ZENDESK_URL) {
        throw (new Error('Environment variable for Zendesk Url is undefined'));
    }
    return new ZendeskClientWrapper(
        zendesk.createClient({
            username: process.env.ZENDESK_API_USERNAME,
            token: process.env.ZENDESK_API_TOKEN,
            remoteUri: buildHelpCenterUri(process.env.ZENDESK_URL),
            helpcenter: true, // In order to use Help Center APIs, this varialbe must be set to `true` AND `remoteUri` must be set to the Help Center endpoint
            disableGlobalState: true // Run as Library only - not scriptrunner
        })
    );
};

function buildHelpCenterUri(zendeskUrl) {
    // Remove trailing slashes
    return zendeskUrl.replace(/\/*?$/g, '') + constants.HELP_CENTER_ENDPOINT;
}

exports.getClient = getClient;
