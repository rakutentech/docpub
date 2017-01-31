const Promise = require('bluebird');
const zendesk = require('node-zendesk');
const ZendeskClientWrapper = require('./client-wrapper');
const constants = require('./constants');
const _ = require('lodash');

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

/**
 * Sets the access policy for a given section
 * @param {number} sectionId - id of the section to set the access policy to
 * @param {Object} meta - metadata for the section to be updated
 * @param {Object} client - optional instance of zendesk API client
 * @returns {Promise} fulfilled promise returns response or nothing if access policy wasn't updated - rejects if API returns error
 */
const setSectionAccessPolicy = function(opts, client) {
    const request = buildAccessPolicyRequest(opts.meta);
    if (!request) {
        return Promise.resolve();
    }
    client = client || getClient();
    return new Promise((resolve, reject) => {
        client.accesspolicies.update(opts.sectionId, request, (err, req, response) => {
            if (err) {
                return reject(err);
            }
            return resolve(response);
        });
    });
};

function buildAccessPolicyRequest(meta) {
    const keymap = {
        viewableBy: constants.SECTION.VIEWABLE_BY,
        manageableBy: constants.SECTION.MANAGEABLE_BY
    };
    const access = _.pick(meta, _.keys(keymap));

    return _.isEmpty(access)
        ? null
        : {[constants.SECTION.ACCESS_POLICY]: _.mapKeys(access, (value, key) => keymap[key])};
}

function buildHelpCenterUri(zendeskUrl) {
    // Remove trailing slashes
    return zendeskUrl.replace(/\/*?$/g, '') + constants.HELP_CENTER_ENDPOINT;
}

exports.getClient = getClient;
exports.setSectionAccessPolicy = setSectionAccessPolicy;
