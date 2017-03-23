const Promise = require('bluebird');
const Uploader = require('./uploader');
const constants = require('./constants');

const logger = require('../logger');

/**
 * Class representing a Zendesk Article uploader
 * @extends Uploader
 */
module.exports = class ArticleUploader extends Uploader {
    /**
     * Creates an ArticleUploader
     * @param {object} article - contains `meta` object with metadata and `section` reference to parent section
     * @param {Config} config - global docpub configuraion
     * @param {object} [zendeskClient] - optional instance of the node-zendesk api client
     */
    constructor(article, config, zendeskClient) {
        super(article, config, zendeskClient);

        this._article = article;
        this._html = null;
    }

    /**
     * Creates an article on Zendesk if it doesn't already exist and then saves the returned ID to meta
     * Then uploads any new or changed resources attached to this article and saves their returned ID to meta
     * @returns {Promise} Fulfills empty promise or rejects with an error object if category creation failed
     */
    create() {
        return super.create()
            .then(() => {
                if (this._document.isNew) {
                    logger.info(`Creating article on ZenDesk: ${this._article.path}`);

                    return this._create()
                        .then(result => super._setReturnedMetadata(result));
                }
                return Promise.resolve();
            })
            .then(() => this._createResources());
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
                    logger.info(`Synchronizing article on ZenDesk: ${this._article.path}`);

                    return this._getHtml()
                        .then(() => this._update())
                        .then(() => this._updateTranslation())
                        .then(() => this._article.updateHash());
                }
                return Promise.resolve();
            });
    }

    _create() {
        const request = {article: this._buildCreateRequest()};
        return this._client.articles.create(this._article.section.meta.zendeskId, request);
    }

    _update() {
        const request = {article: this._buildUpdateRequest()};
        return this._client.articles.update(this._meta.zendeskId, request);
    }

    _updateTranslation() {
        const request = {translation: this._buildTranslationUpdateRequest()};
        return this._client.translations.updateForArticle(this._meta.zendeskId, this._meta.locale, request);
    }

    _buildCreateRequest() {
        const request = super._buildCreateRequest();
        request[constants.ARTICLE.TITLE] = this._meta.title;
        return request;
    }

    _buildUpdateRequest() {
        const request = super._buildUpdateRequest();
        request[constants.ARTICLE.SECTION_ID] = this._article.section.meta.zendeskId;
        if (this._meta.labels) {
            request[constants.ARTICLE.LABELS] = this._meta.labels;
        }
        return request;
    }

    _buildTranslationUpdateRequest() {
        const request = super._buildTranslationUpdateRequest();
        request[constants.TRANSLATIONS.BODY] = this._html;
        return request;
    }

    _getHtml() {
        return this._article.convertMarkdown()
            .then((html) => {
                this._html = html;
            });
    }

    _createResources() {
        let resources = this._article.resources || [];
        resources = resources.filter(resource => {
            return resource.isNew || resource.isChanged;
        });
        return Promise.all(
            resources.map(resource => {
                logger.info(`Creating resource on ZenDesk: ${resource.path}`);

                return this._client.articleattachments.create(this._meta.zendeskId, resource.path)
                    .then(response => {
                        resource.meta.update({
                            zendeskId: response[constants.ID]
                        });
                    });
            })
        ).then(() => {
            return this._article.meta.write();
        });
    }
};
