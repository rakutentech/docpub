const Promise = require('bluebird');
const zendesk = require('node-zendesk');
const constants = require('./constants');

/**
 * Base class for a Zendesk uploader
 * Creates a zendesk api client instance, or can optionally be passed an existing client
 * Also handles metadata that is common to all Uploaders
 * @property {object} meta - contains metadata about the document
 */
module.exports = class Uploader {
    /**
     * Creates an Uploader
     * @param {Object} document - document object containing metadata
     * @param {Object} [zendeskClient] - optional instance of the node-zendesk api client
     * @throws {Error} Will throw an error if the environment variables for the api client are not set
     */
    constructor(document, zendeskClient) {
        if (!process.env.ZENDESK_API_USERNAME) {
            throw (new Error('Environment variable for Zendesk Username is undefined'));
        }
        if (!process.env.ZENDESK_API_TOKEN) {
            throw (new Error('Environment variable for Zendesk Token is undefined'));
        }
        if (!process.env.ZENDESK_URL) {
            throw (new Error('Environment variable for Zendesk Url is undefined'));
        }
        this._client = zendeskClient || zendesk.createClient({
            username: process.env.ZENDESK_API_USERNAME,
            token: process.env.ZENDESK_API_TOKEN,
            remoteUri: this._getHelpCenterUri(process.env.ZENDESK_URL),
            helpcenter: true, // In order to use Help Center APIs, this varialbe must be set to `true` AND `remoteUri` must be set to the Help Center endpoint
            disableGlobalState: true // Run as Library only - not scriptrunner
        });

        this._meta = document.meta;
    }

    /**
     * Uploads data to the Zendesk API in sub-classes
     * @returns {Promise}
     */
    upload() {
        return Promise.resolve();
    }

    _getRequest() {
        const request = {};
        // Set common metadata
        request[constants.ZENDESK_LOCALE] = this._meta.locale || process.env.API_LOCALE || 'en-us';
        if (this._meta.position) {
            request[constants.ZENDESK_POSITION] = this._meta.position;
        }
        return request;
    }

    _getHelpCenterUri(zendeskUrl) {
        // Remove trailing slashes
        return zendeskUrl.replace(/\/*?$/g, '') + constants.HELP_CENTER_ENDPOINT;
    }
};
