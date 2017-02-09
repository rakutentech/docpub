const _ = require('lodash');
const Promise = require('bluebird');

const Dictionary = require('./parser/dictionary');

const path = require('path');
const fsu = require('../fs-utils');
const fs = require('fs-promise');
const hash = require('../hash');

const META_FILE = {
    USER: 'meta.json',
    SYSTEM: '.meta.json'
};

/**
 * Class representing metadata of any ZenDesk document. Incapsulates manipulation with this metadata:
 * reading, updating and saving it.
 * Searches for metadata in 2 files in document directory: meta.json with user information and .meta.json with system information
 * Both user and system metadata structure may be configured in any way by passing root parser for each scheme.
 */
module.exports = class Metadata {
    /**
     * Creates Metadata instance.
     * Constructor accepts user and system meta schemes, both required and must be root dictionaries.
     * The contents of each scheme may be arbitrary
     *
     * @throws {Error} - Throws error if dirPath is not defined or empty
     * @throws {Error} - Throws error if userMetaScheme is not a root Dictionary
     * @throws {Error} - Throws error if systemMetaScheme is not a root Dictionary
     *
     * @param {string} dirPath - path to the document
     * @param {string} userMetaScheme - scheme describing how to parse user metadata
     * @param {string} systemMetaScheme - scheme describing how to parse system metadata
     */
    constructor(dirPath, userMetaScheme, systemMetaScheme) {
        if (typeof dirPath !== 'string') {
            throw new Error('Metadata path must be a string');
        }

        if (!dirPath.length) {
            throw new Error('Metadata path must not be empty');
        }

        this._validateMetaScheme(userMetaScheme, 'User');
        this._validateMetaScheme(systemMetaScheme, 'System');

        this._path = dirPath;
        this._userScheme = userMetaScheme;
        this._systemScheme = systemMetaScheme;

        this._userMeta = {};
        this._systemMeta = {};
    }
    /**
     * Read the metadata from folder.
     * Meta file name with user data is being searched for is `meta.json`. Meta file name with system data is being searched for is `.meta.json`.
     * After reading, meta contents will be populated on `this` as readonly properties
     * If user meta file is missing, returned promise will be rejected
     * If user meta file contains some unexpected properties, returned promise will be rejected.
     * If user meta file missing required properties, returned promise will be rejected.
     *
     * @returns {Promise} Promise to be fulfilled when metadata read completed
     */
    read() {
        return Promise.all([this._loadUserMeta(), this._loadSystemMeta()])
            .spread((userMeta, systemMeta) => {
                this._userMeta = this._userScheme.parse(userMeta);
                this._systemMeta = this._systemScheme.parse(systemMeta || {});

                this._createProperties();
            });
    }

    /**
     * Updates system meta with new values received from zendesk or after hash calculation.
     * Data passed to update is being filtered by system meta keys. I.e. only that data will be updated,
     * which is specified in system scheme on root level.
     * Updates only in-memory values. If needed to be saved, subsequent call of `Metadata.write` required
     * After update recreates properties
     *
     * @param {object} systemData - new data
     */
    update(systemData) {
        const systemKeys = _.keys(this._systemMeta);
        const update = _.pick(systemData, systemKeys);

        _.assign(this._systemMeta, update); // Maybe _.merge ?

        this._createProperties(); // Because new keys may appear
    }

    /**
     * Writes actual state of system meta to the disc.
     * Data would be written at following path: %document_path%/.meta.json.
     * Note: all previous contents of .meta.json would be overwritten by this write.
     *
     * If failed to ensure .meta.json file or to write the contents for any reason, rejects the promise
     *
     * @returns {Promise} - promise to be resolved when writing completed
     */
    write() {
        const systemMetaPath = path.join(this._path, META_FILE.SYSTEM);
        const json = JSON.stringify(this._systemMeta);

        return fs.ensureFile(systemMetaPath)
            .then(() => fs.writeFile(systemMetaPath, json));
    }

    /**
     * Returns hash of the current user meta.
     * Will be different from what stored in hash property if someone changed contents of `meta.json` since last upload
     * @return {string} - hash of current user meta.
     */
    get currentHash() {
        return hash(JSON.stringify(this._userMeta));
    }

    _validateMetaScheme(scheme, schemeName) {
        if (!(scheme instanceof Dictionary)) {
            throw new Error(`${schemeName} meta scheme must be instance of Dictionary parser`);
        }

        if (!scheme.isRoot) {
            throw new Error(`${schemeName} meta scheme is not set to parse JSON file`);
        }
    }

    _loadUserMeta() {
        return fsu.findFile(this._path, META_FILE.USER)
            .then(metaPath => fs.readFile(metaPath, 'utf8'))
            .then(content => JSON.parse(content));
    }

    _loadSystemMeta() {
        return fsu.findFile(this._path, META_FILE.SYSTEM)
            .then(metaPath => fs.readFile(metaPath, 'utf8'))
            .then(content => JSON.parse(content))
            .catch(() => {}); // TODO: log error here ?
    }

    _createProperties() {
        [this._systemMeta, this._userMeta].forEach(meta => {
            _.keys(meta).forEach(key => {
                Object.defineProperty(this, key, {
                    enumerable: true,
                    configurable: true,
                    writeable: false,
                    get: () => meta[key]
                });
            });
        });
    }
};
