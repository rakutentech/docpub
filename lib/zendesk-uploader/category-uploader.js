const Promise = require('bluebird');
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
     * Creates a category and uploads its sections to Zendesk
     * @returns {Promise} Promise with the created category's metadata or an error object if category creation or upload failed
     */
    upload() {
        return super.upload()
            .then(() => this._createCategory())
            .then(result => super._setReturnedMetadata(result))
            .then(() => this._uploadSections())
            .then(() => this.meta);
    }

    _createCategory() {
        const request = {category: this._getRequest()};
        return this._client.categories.create(request);
    }

    _uploadSections() {
        if (this._category.sections.length === 0) {
            return;
        }
        return Promise.all(this._category.sections.map((section) => {
            return new SectionUploader(section, this._client).upload();
        }));
    }

    _getRequest() {
        const request = super._getRequest();
        request[constants.CATEGORY.TITLE] = this._meta.title;
        // Optional parameters
        if (this._meta.description) {
            request[constants.CATEGORY.DESCRIPTION] = this._meta.description;
        }
        return request;
    }
};
