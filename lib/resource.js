const Promise = require('bluebird');
const Document = require('./document');
const metadata = require('./metadata');

const fs = require('fs-promise');
const hash = require('./hash');

/**
 * A class representing ZenDesk resource.
 * Resource can't be independent entity in tree, it must always have parent dodument.
 * @property {string} type - representing type of document. For resource should always be `resource`
 * @property {Article} article - parent Article of this resource.
 * @extends Document
 */
module.exports = class Resource extends Document {
    /**
     * Crate a resource.
     * Type of the resource will be set as `resource`.
     * Unable to create resource without a parent article. If parent is not defined or is not an article, exception will be thrown.
     * @param {string} path - The path to resource contents on filesystem
     *
     * @throws {Error} Will throw error if path is not string or empty
     * @throws {Error} Will throw error if parent is not defined or not an Article
     */
    constructor(path, parent) {
        super(path, parent);

        if (!parent || parent.type !== 'article') {
            throw new Error('Resource can only exist as a child of article');
        }

        this.type = 'resource';
        this.meta = metadata.buildForResource(path, this.article.meta);
    }

    /**
     * Returns parent Article of the resource
     *
     * @return {Article} - parent Article
     */
    get article() {
        return this._parent;
    }

    /**
     * Returns hash of the resource content
     * If resource was not read, returns empty string
     *
     * @return {string} - hash of the content
     */
    get hash() {
        return this._contentHash || '';
    }

    /**
     * Read meta and contents of the resource. Searches for meta properties of the resource
     * in parent article's meta by resource filename. After this populates found propertis or default ones on self.
     * Also reads resource contens, calculates hash of this contens and makes it available via `resource.hash`
     * If failed to read resource contents, promise will be rejected
     *
     * @returns {Promise} Promise to be fulfilled if all reads were corect
     */
    read() {
        return super.read()
            .then(() => fs.readFile(this.path))
            .then(contents => this._contentHash = hash(contents));
    }

    /**
     * Updates own hash with meta hash.
     * Since article meta is being shared by several resources, write is not performed in order to
     * avoid race conditions.
     * Method is done in async way in order to correspond Document interface
     *
     * @returns {Promise} - promise to be fulfilled after resource meta will be updated
     */
    updateHash() {
        return new Promise(resolve => {
            this._syncOwnHash();

            resolve();
        });
    }
};
