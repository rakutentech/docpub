const Promise = require('bluebird');
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
     * Creates a section and recursively uploads its articles to Zendesk
     * @returns {Promise} Promise with the created sections's metadata or an error object if section creation or upload failed
     */
    upload() {
        // Required Properties
        if (!this._section.category.meta.id) {
            return Promise.reject(new Error('`id` is missing from this sections category metadata'));
        }

        return super.upload()
            .then(() => this._createSection())
            .then(() => this._uploadArticles(this._section.articles))
            .then(() => this.meta);
    }

    _createSection() {
        const request = {section: this._getRequest()};
        return new Promise((resolve, reject) => {
            this._client.sections.create(this._section.category.meta.id, request, (err, req, result) => {
                if (err) {
                    return reject(err);
                }
                super._setReturnedMetadata(result);
                return resolve();
            });
        });
    }

    _uploadArticles(articles) {
        if (!articles || articles.length === 0) {
            return;
        }
        // TODO: implement handling for the API call rate limit (and possibly request queuing) in the zendesk client
        return Promise.all(articles.map((article) => {
            return new ArticleUploader(article, this._client).upload();
        }));
    }

    _getRequest() {
        const request = super._getRequest();
        request[constants.SECTION.TITLE] = this._meta.title;
        // Optional parameters
        if (this._meta.description) {
            request[constants.SECTION.DESCRIPTION] = this._meta.description;
        }
        return request;
    }
};
