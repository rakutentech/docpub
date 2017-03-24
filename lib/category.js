const Promise = require('bluebird');

const Document = require('./document');
const Section = require('./section');

const metadata = require('./metadata');

const fsu = require('./fs-utils');
const logger = require('./logger');

/**
 * A class representing ZenDesk category
 * @property {string} type representing type of document. For category should always be `category`
 * @property {Array} sections a set of child section for this category.
 * @extends Document
 */
module.exports = class Category extends Document {
    /**
     * Crate a Category.
     * Type of the category will be set as `category`
     * @param {string} path - The path to category contents on filesystem
     * @param {Config} config - instance of Config
     *
     * @throws {Error} Will throw error if path is not string or empty
     */
    constructor(path, config) {
        super(path, config);

        this.type = 'category';
        this.meta = metadata.buildForCategory(path);
    }

    /**
     * Returns list of category's child sections
     * @return {Section[]} - sections of category
     */
    get sections() {
        return this._children;
    }

    /**
     * Read the meta file and sections list.
     * Meta file name is being searched for is `meta.json`. After reading, meta contents
     * will be assigned to `this.meta`
     * If meta file is missing, returned promise will be rejected
     * If failed to read sections for some reason, returned promise will be rejected
     *
     * @returns {Promise} Promise to be fulfilled if all reads were corect
     */
    read() {
        logger.info(`Reading category ${this.path}`);

        return super.read()
            .then(() => fsu.listSubdirectories(this.path))
            .then(sectionPaths => {
                this.setChildren(
                    sectionPaths.map(sectionPath => new Section(sectionPath, this._config, this))
                );

                return Promise.all(this.sections.map(section => section.read()));
            });
    }
};
