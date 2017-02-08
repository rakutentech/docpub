const Promise = require('bluebird');

const Document = require('./document');
const Article = require('./article');

const metadata = require('./metadata');

const fsu = require('./fs-utils');

/**
 * A class representing ZenDesk section
 * @property {string} type - representing type of document. For section should always be `section`
 * @property {Category} category - a parent category for this section
 * @property {Array} articles - a set of child articles for this section.
 */
module.exports = class Section extends Document {
    /**
     * Crate a Section.
     * Type of the category will be set as `section`
     * @param {string} path - The path to section contents on filesystem
     * @param {Category} category - Parent category for this section
     *
     * @throws {Error} Will throw error if path is not string or empty
     */
    constructor(path, category) {
        super(path, category);

        if (!category) {
            throw new Error(`Missing parent category for section ${this._path}`);
        }

        this.meta = metadata.buildForSection(path);

        this.type = 'section';
    }
    get category() {
        return this._parent;
    }

    get articles() {
        return this._children;
    }

    /**
     * Read the meta file and articles list.
     * Meta file name is being searched for is `meta.json`. After reading, meta contents
     * will be assigned to `this.meta`
     * If meta file is missing, returned promise will be rejected
     * If failed to read articles for some reason, returned promise will be rejected
     *
     * @returns {Promise} Promise to be fulfilled if all reads were corect
     */
    read() {
        return super.read()
            .then(() => fsu.listSubdirectories(this.path))
            .then(articlesPaths => {
                this._children = articlesPaths.map(articlePath => new Article(articlePath, this));

                return Promise.all(this.articles.map(article => article.read()));
            });
    }
};
