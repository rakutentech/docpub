const Document = require('./document');

/**
 * A class representing ZenDesk section
 */
module.exports = class Section extends Document {
    /**
     * Crate a Section.
     * Type of the category will be set as `section`
     * @param {string} path - The path to section contents on filesystem
     *
     * @throws {Error} Will throw error if path is not string or empty
     */
    constructor(path) {
        super(path);

        this.type = 'section';
        this.articles = [];
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
            .then(articlesPaths => {
                articlesPaths.map(() => {});
            });
    }
};
