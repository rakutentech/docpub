const Promise = require('bluebird');
const Document = require('./document');
const fsu = require('./fs-utils');

const SupportedStaticTypes = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf'];

/**
 * A class representing ZenDesk article.
 * Responsible for reading article contents (.md and resources in .jpg, .jpeg, .png, .gif, .svg and .pdf)
 * and for converting found markdown into html.
 * All reads and conversions expected to be lazy.
 * @property {string} type - representing type of document. For article should always be `article`
 * @property {Section} section - a parent section for this article
 * @property {object} resources - dictionary of article resources grouped by extension.
 * @extends Document
 */
module.exports = class Article extends Document {
    /**
     * Crate an Article.
     * Type of the article will be set as `article`
     * @param {string} path - The path to article contents on filesystem
     * @param {Section} section - section parent to this article
     *
     * @throws {Error} Will throw error if path is not string or empty
     */
    constructor(path, section) {
        super(path);

        if (!section) {
            throw new Error(`Missing section for article ${this._path}`);
        }

        this.type = 'article';
        this.section = section;
        this.resources = {};

        this._markdownPath = null;
        this._html = null;
    }

    /**
     * Read the meta file and articles contents. Searches for .md file and resources in
     * .jpg, .jpeg, .png, .gif, .svg and .pdf formats
     * Meta file name is being searched for is `meta.json`. After reading, meta contents
     * will be assigned to `this.meta`
     * If meta file is missing, returned promise will be rejected
     * If failed to search for .md files, returned promise will be rejected
     * If no .md files found, returned promise will be rejected
     * If found more than 1 .md file, promise will be rejected
     * If failed to search for resources, promise will be rejected
     * If searches successful, assignes found resources to this.resources, grouping them
     * by resource type (file extension)
     *
     * @returns {Promise} Promise to be fulfilled if all reads were corect
     */
    read() {
        return super.read()
            .then(() => this._readMarkdown())
            .then(mdPath => {
                this._markdownPath = mdPath;

                return this._readResources();
            })
            .then(resources => this.resources = resources);
    }

    _readMarkdown() {
        return fsu.findFilesOfTypes(this._path, '.md')
            .then(files => {
                const mdFiles = files['md'];

                if (!mdFiles) {
                    return Promise.reject(new Error(`No markdown files found for article ${this._path}`));
                }

                if (mdFiles.length > 1) {
                    const msg = `Found more than 1 markdown file for article ${this._path}.\n` +
                                +`Unable to determine which to use.\n` +
                                +`Files list: ${mdFiles.join(', ')}`;
                    return Promise.reject(new Error(msg));
                }

                return mdFiles[0];
            });
    }

    _readResources() {
        return fsu.findFilesOfTypes(this._path, SupportedStaticTypes);
    }
};
