const Promise = require('bluebird');
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
     * Uploads an article to Zendesk
     * @returns {Promise} Promise with the created article's metadata or an error object if upload failed
     */
    upload() {
        // Required Properties
        if (!this._article.section.meta.id) {
            return Promise.reject(new Error('`id` is missing from this articles section metadata'));
        }

        return super.upload()
            .then(() => this._getHtml())
            .then(() => this._uploadArticle())
            .then((result) => {
                super._setReturnedMetadata(result);
                return this.meta;
            });
    }

    _uploadArticle() {
        let request = {article: this._getRequest()};
        return this._client.articles.create(this._article.section.meta.id, request);
    }

    _getRequest() {
        const request = super._getRequest();
        request[constants.ARTICLE.TITLE] = this._meta.title;
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
