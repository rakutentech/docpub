const Promise = require('bluebird');
const _ = require('lodash');
const path = require('path');
const Metadata = require('./metadata');

const utils = require('./utils');

/**
 * Class representing resource metadata.
 * Unlike metadata for regular ZenDesk entities, resource metadata stored in article's `.meta.json` file. This leads to the fact, that this class
 * does not manipulate contents of metadata files `meta.json` and `.meta.json`. Instead it manipulates `resources` section in article's metadata.
 * More precisely, it looks for a resource meta by resource filename in `articleMeta.resources`, and does updates only for that chunk of data.
 * For convenience, implements same interface with regular `Metadata`.
 */
module.exports = class ResourceMetadata {
    /**
     * Creates ResourceMetadata instance.
     * Constructor accepts article metadata to make it possible to read/update/write resource meta updates.
     *
     * @throws {Error} - Throws error if path is not a string or empty
     * @throws {Error} - Throws error if articleMeta is not defined or not an instance of Metadatas
     *
     * @param {string} path - path to the resource
     * @param {Metadata} articleMeta - metadata of article parent
     */
    constructor(resourcePath, articleMeta) {
        if (typeof resourcePath !== 'string') {
            throw new Error('Metadata path must be a string');
        }

        if (!resourcePath.length) {
            throw new Error('Metadata path must not be empty');
        }

        if (!(articleMeta instanceof Metadata)) {
            throw new Error('articleMeta must be instance of Metadata');
        }

        this._path = resourcePath;
        this._filename = path.basename(resourcePath);
        this._articleMeta = articleMeta;

        this._systemMeta = {};
    }

    /**
     * Read the metadata of the resource.
     * Metadata is being read from article's metadata by resource filename
     * After reading metadata, it is being populated on self as getters.
     * Desite no async operations are being performed in this method, it is made async
     * in order to make interface consistent with Metadata class
     *
     * @returns {Promise} Promise to be fulfilled when metadata read completed
     */
    read() {
        return Promise.resolve()
            .then(() => this._readMeta())
            .then(() => this._createProperties());
    }

    /**
     * Updates meta with new values received from zendesk or after hash calculation.
     * Data passed to update is being filtered by `zendeskId` and `hash` keys. All other data will be omitted.
     * Updates only in-memory values. If needed to be saved, subsequent call of `Metadata.write` required.
     * Also updates not only self state, but state of corresponding object in `articleMeta.resources`, i.e.
     * `articleMeta.resources[this._filename] = _.clone(this._rawMeta)`
     * After update recreates properties
     *
     * @param {object} systemData - new data
     */
    update(metaUpdate) {
        _.assign(this._systemMeta, _.pick(metaUpdate, ['zendeskId', 'hash']));
        this._createProperties();

        const resources = _.cloneDeep(this._articleMeta.resources || {});
        resources[this._filename] = this._systemMeta;

        this._articleMeta.update({resources});
    }

    /**
     * Saves current state of resource meta to the disc by updating article's meta and calling save on it.
     * If failed to save article's meta for any reason, rejects the promise
     *
     * @returns {Promise} - promise to be resolved when writing completed
     */
    write() {
        return Promise.resolve()
            .then(() => this.update())
            .then(() => this._articleMeta.write());
    }

    _readMeta() {
        const meta = this._articleMeta.resources
            ? _.cloneDeep(this._articleMeta.resources[this._filename])
            : {};

        this._systemMeta = _.defaults(meta, {
            zendeskId: 0,
            hash: ''
        });
    }

    _createProperties() {
        utils.defineGetters(this, this._systemMeta);
    }
};
