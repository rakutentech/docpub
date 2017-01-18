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
        if (!this.meta.title) {
            return Promise.reject(new Error('`title` is missing from the metadata'));
        }

        let request = {article: this._getRequest()};
        return new Promise((resolve, reject) => {
            this._client.articles.create(this._article.section.meta.id, request, (err, req, result) => {
                if (err) {
                    reject(err);
                }
                this._setReturnedMetadata(result);
                resolve(this._meta);
            });
        });
    }

    _getRequest() {
        const request = super._getRequest();
        request[constants.ZENDESK_ARTICLE_TITLE] = this.meta.title;
        request[constants.ZENDESK_ARTICLE_HTML] = this._article.html;

        // Optional properties
        if (this._meta.labels) {
            request[constants.ZENDESK_ARTICLE_LABELS] = this._getLabelsArray(this.meta.labels);
        }
        return request;
    }

    _setReturnedMetadata(result) {
        this._meta.id = result[constants.ZENDESK_ID];
        this._meta.position = result[constants.ZENDESK_POSITION];
    }

    get meta() {
        return this._meta;
    }

    _getLabelsArray(labels) {
        labels = !Array.isArray(labels) ? labels.split(',') : labels;
        return labels.map((label) => label.trim());
    }
};
