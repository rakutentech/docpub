/**
 * A basic class representing ZenDesk entity: Category, Section or Article
 * Supports reading meta information and subfolders of entity's folder
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
    constructor(path) {
        if (typeof path !== 'string') {
            throw new Error('Document path must be a string');
        }

        if (!path.length) {
            throw new Error('Document path must not be empty');
        }

        this._path = path;

        this.type = 'generic_document';
        this.meta = null;
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
};
