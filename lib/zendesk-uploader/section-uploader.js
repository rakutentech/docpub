const Promise = require('bluebird');
const _ = require('lodash');
const Uploader = require('./uploader');
const ArticleUploader = require('./article-uploader');
const constants = require('./constants');

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
                if (!this._meta.zendeskId) {
                    return this._createSection()
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
                    return this._updateSection()
                        .then(() => this._setSectionAccessPolicy());
                }
                return Promise.resolve();
            })
            .then(() => this._syncArticles(this._section.articles));
    }

    _createSection() {
        const request = {section: this._buildBaseRequest()};
        return this._client.sections.create(this._section.category.meta.zendeskId, request);
    }

    _updateSection() {
        const request = {section: this._buildSyncRequest()};
        return this._client.sections.update(this._meta.zendeskId, request);
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

    _setSectionAccessPolicy() {
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

    _buildBaseRequest() {
        const request = super._buildBaseRequest();
        request[constants.SECTION.TITLE] = this._meta.title;
        return request;
    }

    _buildSyncRequest() {
        const request = _.assign(this._buildBaseRequest(), super._buildSyncRequest());
        // Optional parameters
        if (this._meta.description) {
            request[constants.SECTION.DESCRIPTION] = this._meta.description;
        }
        return request;
    }
};
