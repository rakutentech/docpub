const Promise = require('bluebird');
const Uploader = require('./uploader');
const SectionUploader = require('./section-uploader');
const constants = require('./constants');

const logger = require('../logger');

/**
 * Class representing a Zendesk Category uploader
 * Creates a category and uploads all sections into that category
 * @extends Uploader
 */
module.exports = class CategoryUploader extends Uploader {
    /**
     * Creates a CategoryUploader
     * @param {object} category - contains `meta` object with metadata
     * @param {Config} config - global docpub configuraion
     * @param {Object} [zendeskClient] - optional instance of the node-zendesk api client
     */
    constructor(category, config, zendeskClient) {
        super(category, config, zendeskClient);
        this._config = config;
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
                if (this._document.isNew) {
                    logger.info(`Creating new category on ZenDesk: ${this._category.path}`);

                    return this._create()
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
                    logger.info(`Synchronizing category on ZenDesk: ${this._category.path}`);
                    return this._update()
                        .then(() => this._updateTranslation())
                        .then(() => this._category.updateHash());
                }
                return Promise.resolve();
            })
            .then(() => this._syncSections());
    }

    _create() {
        const request = {category: this._buildCreateRequest()};
        return this._client.categories.create(request);
    }

    _update() {
        const request = {category: super._buildUpdateRequest()};
        return this._client.categories.update(this._meta.zendeskId, request);
    }

    _updateTranslation() {
        const request = {translation: this._buildTranslationUpdateRequest()};
        return this._client.translations.updateForCategory(this._meta.zendeskId, this._meta.locale, request);
    }

    _createSections() {
        return Promise.all(this._category.sections.map((section) => {
            return new SectionUploader(section, this._config, this._client).create();
        }));
    }

    _syncSections() {
        return Promise.all(this._category.sections.map((section) => {
            return new SectionUploader(section, this._config, this._client).sync();
        }));
    }

    _buildCreateRequest() {
        const request = super._buildCreateRequest();
        request[constants.CATEGORY.TITLE] = this._meta.title;
        return request;
    }

    _buildTranslationUpdateRequest() {
        const request = super._buildTranslationUpdateRequest();
        if (this._meta.description) {
            request[constants.TRANSLATIONS.BODY] = this._meta.description;
        }
        return request;
    }
};
