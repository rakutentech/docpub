const Promise = require('bluebird');
const _ = require('lodash');
const Uploader = require('./uploader');
const SectionUploader = require('./section-uploader');
const constants = require('./constants');

/**
 * Class representing a Zendesk Category uploader
 * Creates a category and uploads all sections into that category
 * @extends Uploader
 */
module.exports = class CategoryUploader extends Uploader {
    /**
     * Creates a CategoryUploader
     * @param {object} category - contains `meta` object with metadata
     * @param {object} [zendeskClient] - optional instance of the node-zendesk api client
     */
    constructor(category, zendeskClient) {
        super(category, zendeskClient);
        this._category = category;
    }

    /**
     * Uploads a category to Zendesk by first creating any missing category, sections, or articles and then syncing all of them
     * @returns {Promise} Promise with the created category's metadata or an error object if category creation or upload failed
     */
    upload() {
        return this.create()
            .then(() => this.sync());
    }

    /**
     * Creates a category and its sections on Zendesk if it doesn't already exist
     * Does nothing to the category if it already exists but it will still attempt to create sections
     * @returns {Promise} Fulfills empty promise or rejects with an error object if category creation failed
     */
    create() {
        return super.create()
            .then(() => {
                if (!this._meta.zendeskId) {
                    return this._createCategory()
                        .then(result => super._setReturnedMetadata(result));
                }
                return Promise.resolve();
            })
            .then(() => this._createSections());
    }

    /**
     * Syncs an category and its sections to Zendesk
     * Updates the category metadata if it has changed since last sync
     * @returns {Promise} Fulfills empty promise or rejects with an error object if sync failed
     */
    sync() {
        return super.sync()
            .then((isChanged) => {
                if (isChanged) {
                    return this._updateCategory()
                        .then(() => this._category.updateHash());
                }
                return Promise.resolve();
            })
            .then(() => this._syncSections());
    }

    _createCategory() {
        const request = {category: this._buildBaseRequest()};

        return this._client.categories.create(request);
    }

    _updateCategory() {
        const request = {category: this._buildSyncRequest()};

        return this._client.categories.update(this._meta.zendeskId, request);
    }

    _createSections() {
        return Promise.all(this._category.sections.map((section) => {
            return new SectionUploader(section, this._client).create();
        }));
    }

    _syncSections() {
        return Promise.all(this._category.sections.map((section) => {
            return new SectionUploader(section, this._client).sync();
        }));
    }

    _buildBaseRequest() {
        const request = super._buildBaseRequest();
        request[constants.CATEGORY.TITLE] = this._meta.title;
        return request;
    }

    _buildSyncRequest() {
        const request = _.assign(this._buildBaseRequest(), super._buildSyncRequest());
        // Optional parameters
        if (this._meta.description) {
            request[constants.CATEGORY.DESCRIPTION] = this._meta.description;
        }
        return request;
    }
};
