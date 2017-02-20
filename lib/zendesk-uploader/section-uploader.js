const Promise = require('bluebird');
const Uploader = require('./uploader');
const ArticleUploader = require('./article-uploader');
const constants = require('./constants');

const logger = require('../logger');

/**
 * Class representing a Zendesk Section uploader
 * Creates a section and uploads all articles into that section
 * @extends Uploader
 */
module.exports = class SectionUploader extends Uploader {
    /**
     * Creates a SectionUploader
     * @param {object} section - contains `meta` object with metadata and `category` reference to parent category
     * @param {object} [zendeskClient] - optional instance of the node-zendesk api client
     */
    constructor(section, zendeskClient) {
        super(section, zendeskClient);
        this._section = section;
    }

    /**
     * Creates a section on Zendesk if it doesn't already exist
     * Does nothing to the section if it already exists but it will still attempt to create its articles
     * @returns {Promise} Fulfills empty promise or rejects with an error object if category creation failed
     */
    create() {
        return super.create()
            .then(() => {
                if (this._document.isNew) {
                    logger.info(`Creating new section on ZenDesk: ${this._section.path}`);

                    return this._create()
                        .then(result => super._setReturnedMetadata(result));
                }
                return Promise.resolve();
            })
            .then(() => this._createArticles(this._section.articles));
    }

    /**
     * Syncs an section and its articles to Zendesk
     * Updates the section metadata if it has changed since last sync
     * @returns {Promise} Fulfills an empty promise or rejects with an error object if the sync failed
     */
    sync() {
        return super.sync()
            .then((isChanged) => {
                if (isChanged) {
                    logger.info(`Synchronizing section on ZenDesk: ${this._section.path}`);

                    return this._update()
                        .then(() => this._updateTranslation())
                        .then(() => this._updateAccessPolicy())
                        .then(() => this._section.updateHash());
                }
                return Promise.resolve();
            })
            .then(() => this._syncArticles(this._section.articles));
    }

    _create() {
        const request = {section: this._buildCreateRequest()};
        return this._client.sections.create(this._section.category.meta.zendeskId, request);
    }

    _update() {
        const request = {section: super._buildUpdateRequest()};
        return this._client.sections.update(this._meta.zendeskId, request);
    }

    _updateTranslation() {
        const request = {translation: this._buildTranslationUpdateRequest()};
        return this._client.translations.updateForSection(this._meta.zendeskId, this._meta.locale, request);
    }

    _createArticles(articles) {
        if (!articles || articles.length === 0) {
            return;
        }
        return Promise.all(articles.map((article) => {
            return new ArticleUploader(article, this._client).create();
        }));
    }

    _syncArticles(articles) {
        if (!articles || articles.length === 0) {
            return;
        }
        return Promise.all(articles.map((article) => {
            return new ArticleUploader(article, this._client).sync();
        }));
    }

    _updateAccessPolicy() {
        const request = {
            [constants.SECTION.ACCESS_POLICY]: {
                [constants.SECTION.VIEWABLE_BY]: this._meta.viewableBy,
                [constants.SECTION.MANAGEABLE_BY]: this._meta.manageableBy
            }
        };
        if (!request) {
            return Promise.resolve();
        }
        return this._client.accesspolicies.update(this._meta.zendeskId, request);
    }

    _buildCreateRequest() {
        const request = super._buildCreateRequest();
        request[constants.SECTION.TITLE] = this._meta.title;
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
