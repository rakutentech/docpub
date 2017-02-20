const _ = require('lodash');
const path = require('path');

/**
 * A basic class representing ZenDesk entity: Category, Section or Article
 * Supports reading meta information and searching for Zendesk IDs of documents in documents tree
 * Other ZenDesk entities inherit from this Class
 */
module.exports = class Document {
    /**
     * Crate a document.
     * Type of the document will be set as `generic_document`
     * @param {string} path - The path to document contents on filesystem
     *
     * @throws {Error} Will throw error if path is not string or empty
     */
    constructor(docPath, parent) {
        if (typeof docPath !== 'string') {
            throw new Error('Document path must be a string');
        }

        if (!docPath.length) {
            throw new Error('Document path must not be empty');
        }

        if (parent && !(parent instanceof Document)) {
            throw new Error('Parent should be instance of Document');
        }

        this._parent = parent;
        this._children = [];

        this.path = docPath;
        this.type = 'generic_document';
        this.meta = null;
    }

    /*
     * Helper property indicating that document was never created on ZenDesk
     * @return {boolean} is document new or not
     */
    get isNew() {
        return this.meta
            ? this.meta.zendeskId === 0
            : false;
    }

    /**
     * Helper property indicating that document content changed and it needs to be re-uploaded to ZenDesk
     * @return {Boolean} is document contents changed from last upload or not
     */
    get isChanged() {
        return this.meta
            ? (this.hash !== this.meta.hash)
            : false;
    }

    /**
     * Returns hash of the object.
     * For documents without contents it's equal to Metadata.userMetaHash
     * @return {string} - hash of the document
     */
    get hash() {
        return this.meta
            ? this.meta.userMetaHash
            : '';
    }

    /**
     * Read the metadata for the document.
     * This implementation just calls {Metadata.read} method. About metadata reading details @see {@link Metadata.read}
     *
     * @returns {Promise} Promise to be fulfilled when metadata read completed
     */
    read() {
        return this.meta.read();
    }

    /**
     * Updates own meta with `{hash: this.hash}`
     *
     * @returns {Promise} - promise to be resolved when update will be completed
     */
    updateHash() {
        this._syncOwnHash();

        return this.meta.write();
    }

    /**
     * Set children of the document. All entities must be Documents or inherit from it.
     * If any of entities is not kind of document, exception will be thrown.
     *
     * @throws {Error} - throws error if any of passed children is no kind of document
     */
    setChildren(children) {
        if (!children) {
            return this._children = [];
        }

        children = [].concat(children);

        children.forEach(child => {
            if (!(child instanceof Document)) {
                throw new Error('Child must be kind of Document');
            }
        });

        this._children = children;
    }
    /**
     * Search for document's Zendesk id in tree of documents.
     * Function supports generic unix-like paths. Passed path must be relative. If passed absolute path, it well be processed as relative.
     * With that said, navigation start from current node and follow path until possible.
     * Path parts compared using `endsWith` with other documents paths.
     *
     * @param {string} docPath - path to the document
     *
     * @returns {number|undefined} - zendeskId of entity corresponding to the path or undefined if failed to found
     */
    findByPath(docPath) {
        docPath = docPath || [];

        if (typeof docPath === 'string') {
            docPath = _.compact(path.normalize(docPath).split(path.sep));
        }

        if (docPath.length === 0) {
            return this.meta.zendeskId;
        }

        const component = docPath.shift();

        if (component === '.') {
            return this.findByPath(docPath);
        }

        if (component === '..') {
            return this._parent.findByPath(docPath);
        }

        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];

            if (child.path.endsWith(component)) {
                return child.findByPath(docPath);
            }
        }

        return undefined;
    }

    /**
     * Returns flat representation of document tree.
     * Includes self to the result.
     *
     * @returns {Document[]} - document tree represented as flat array
     */
    flatTree() {
        let result = [this];

        this._children.forEach(child => {
            result = result.concat(child.flatTree());
        });

        return result;
    }

    _syncOwnHash() {
        this.meta.update({hash: this.hash});
    }
};
