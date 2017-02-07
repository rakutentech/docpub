const Promise = require('bluebird');
const _ = require('lodash');
const Uploader = require('./uploader');
const constants = require('./constants');

/**
 * Class representing a Zendesk Article uploader
 * @extends Uploader
 */
module.exports = class ArticleUploader extends Uploader {
    /**
     * Creates an ArticleUploader
     * @param {object} article - contains `meta` object with metadata and `section` reference to parent section
     * @param {object} [zendeskClient] - optional instance of the node-zendesk api client
     */
    constructor(article, zendeskClient) {
        super(article, zendeskClient);
        this._article = article;
        this._html = null;
    }

    /**
     * Creates an article on Zendesk if it doesn't already exist
     * Does nothing if the article exists already
     * @returns {Promise} Fulfills empty promise or rejects with an error object if category creation failed
     */
    create() {
        return super.create()
            .then(() => {
                if (!this._meta.zendeskId) {
                    return this._createArticle()
                        .then(result => super._setReturnedMetadata(result));
                }
                return Promise.resolve();
            });
    }

    /**
     * Syncs an article to Zendesk
     * Updates article if the article has changed since the last sync
     * @returns {Promise} Fulfills empty promise or rejects with an error object
     */
    sync() {
        return super.sync()
            .then((isChanged) => {
                if (isChanged) {
                    return this._getHtml()
                        .then(() => this._updateArticle());
                }
                return Promise.resolve();
            });
    }

    _createArticle() {
        let request = {article: this._buildBaseRequest()};
        return this._client.articles.create(this._article.section.meta.zendeskId, request);
    }

    _updateArticle() {
        let request = {article: this._buildSyncRequest()};
        return this._client.articles.update(this._meta.zendeskId, request);
    }

    _buildBaseRequest() {
        const request = super._buildBaseRequest();
        request[constants.ARTICLE.TITLE] = this._meta.title;
        return request;
    }

    _buildSyncRequest() {
        const request = _.assign(this._buildBaseRequest(), super._buildSyncRequest());
        request[constants.ARTICLE.SECTION_ID] = this._article.section.meta.zendeskId;
        request[constants.ARTICLE.HTML] = this._html;

        // Optional properties
        if (this._meta.labels) {
            request[constants.ARTICLE.LABELS] = this._meta.labels;
        }
        return request;
    }

    _getHtml() {
        return this._article.convertMarkdown()
            .then((html) => {
                this._html = html;
            });
    }
};
