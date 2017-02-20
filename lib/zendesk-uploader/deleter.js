const Promise = require('bluebird');
const _ = require('lodash');
const constants = require('./constants');
const apiUtils = require('./api-utils');

const logger = require('../logger');

/**
 * Class representing a Zendesk Deleter
 * Compares list of articles and sections in the Category object to the list of articles and sections on Zendesk
 * Then deletes items from Zendesk that are present on Zendesk but not in the Category object
 * @extends Uploader
 */
module.exports = class ZendeskDeleter {
    /**
     * Creates a ZendeskDeleter
     * @param {object} category - Category instance to compare against
     * @param {object} [zendeskClient] - optional instance of the node-zendesk api client
     */
    constructor(category, zendeskClient) {
        this._client = zendeskClient || apiUtils.getClient();
        this._category = category;
        this._documents = this._category.flatTree();
    }

    /**
     * Deletes sections and articles from Zendesk that do not exist in the given Category tree
     * @returns {Promise} fulfills empty promise or rejects with error
     */
    delete() {
        logger.info('Removing dangling entities from ZenDesk');

        return this._deleteSections()
            .then(() => this._deleteArticles());
    }

    _deleteSections() {
        const sections = this._documents.filter((document) => document.type === 'section');
        return this._getItemsToDelete(sections, 'sections')
            .then(sectionsToDelete => {
                logger.trace(`Removing sections: ${sectionsToDelete.map(section => section.id)}`);

                return this._deleteItems(sectionsToDelete, 'sections');
            });
    }

    _deleteArticles() {
        const articles = this._documents.filter((document) => document.type === 'article');
        return this._getItemsToDelete(articles, 'articles')
            .then(articlesToDelete => {
                logger.trace(`Removing articles: ${articlesToDelete.map(article => article.id)}`);

                return this._deleteItems(articlesToDelete, 'articles');
            });
    }

    _getItemsToDelete(documents, endpoint) {
        return this._client[endpoint].listByCategory(this._category.meta.zendeskId)
            .then(zendeskItems => {
                return _.differenceWith(zendeskItems, documents, (zendeskItem, document) => {
                    return zendeskItem[constants.ID] === document.meta.zendeskId;
                });
            });
    }

    _deleteItems(items, endpoint) {
        if (!items) {
            return Promise.resolve();
        }
        return Promise.all(items.map(item => this._client[endpoint].delete(item[constants.ID])));
    }
};
