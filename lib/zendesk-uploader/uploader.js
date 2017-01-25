const Promise = require('bluebird');
const apiUtils = require('./api-utils');
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
        this._client = zendeskClient || apiUtils.getClient();
        this._meta = document.meta;
    }

    /**
     * Uploads data to the Zendesk API in sub-classes
     * @returns {Promise} fulfills empty promise on success - rejects with error if required properties are missing from meta
     */
    upload() {
        if (!this._meta.title) {
            return Promise.reject(new Error('`title` is missing from the metadata'));
        }
        return Promise.resolve();
    }

    _getRequest() {
        const request = {};
        // Set common metadata
        request[constants.LOCALE] = this._meta.locale || process.env.ZENDESK_API_LOCALE || 'en-us';
        if (this._meta.position) {
            request[constants.POSITION] = this._meta.position;
        }
        return request;
    }

    _setReturnedMetadata(result) {
        this._meta.id = result[constants.ID];
        this._meta.position = result[constants.POSITION];
    }

    get meta() {
        return this._meta;
    }
};
