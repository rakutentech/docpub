const _ = require('lodash');
const Promise = require('bluebird');
const Document = require('./document');
const Resource = require('./resource');
const MarkdownRenderer = require('./md-renderer');

const metadata = require('./metadata');

const fsu = require('./fs-utils');
const fs = require('fs-promise');
const hash = require('./hash');

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
        super(path, section);

        if (!section) {
            throw new Error(`Missing section for article ${this.path}`);
        }

        this.meta = metadata.buildForArticle(path);

        this.type = 'article';

        this._mdRenderer = new MarkdownRenderer();
        this._markdownHash = '';
        this._markdown = null;
        this._html = null;
    }

    /**
     * Return parent of the article
     *
     * @return {Document} - parent of the article. Ususally a Section.
     */
    get section() {
        return this._parent;
    }

    /**
     * Returns resources of the article
     *
     * @return {Resource[]} - resources of the article
     */
    get resources() {
        return this._children;
    }

    /**
     * Indicates was article changed from previous upload or not.
     * First checks is meta hash changed from previous launch. If not, checks are there some resources,
     * whose content changed.
     * @return {Boolean} - is article changed or not
     */
    get isChanged() {
        return !!(super.isChanged || _.find(this.resources, 'isChanged'));
    }

    /**
     * Returns hash of the article.
     * Calculated as hash(user metadata hash + content hash)
     *
     * @return {string} - hash of the article
     */
    get hash() {
        return hash(
            super.hash +
            this._markdownHash +
            this.section.meta.zendeskId.toString()
        );
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
     * If failed to read markdown file for some reason, rejects the promise
     * If failed to search for resources, promise will be rejected
     * If searches successful, assignes found resources to this.resources, and starts
     * reading each resource meta and contents
     *
     * @returns {Promise} Promise to be fulfilled if all reads were corect
     */
    read() {
        return super.read()
            .then(() => this._readMarkdown())
            .then(markdown => {
                this._markdown = markdown;
                this._markdownHash = hash(this._markdown);

                return this._readResources();
            })
            .then(resources => {
                this.setChildren(
                    resources.map(path => new Resource(path, this))
                );

                return Promise.all(this.resources.map(resource => resource.read()));
            });
    }

    /**
     * Converts the contents of previously found markdown file to html
     * Caches the results of conversion for any subsequent calls. That is, on second call it will not do another read of file system.
     * Instead it will just return result of previous conversion.
     *
     * If read() was never called before calling convertMarkdown(), rejects the promise.
     * If failed to convert markdown for some reason, rejects the promise.
     * If was able to successfully read file and convert markdown, resolves promise with resulting html
     *
     * @returns {Promise} Promise to be fulfilled with html generated from markdown
     */
    convertMarkdown() {
        if (!this._markdown) {
            return Promise.reject(new Error('No path to markdown available. Forgot to call Article.read()?'));
        }

        if (this._html) {
            return Promise.resolve(this._html);
        }

        return Promise.resolve()
            .then(() => this._mdRenderer.render(this._markdown))
            .then(html => {
                this._html = html;

                return html;
            });
    }

    _readMarkdown() {
        return fsu.findFilesOfTypes(this.path, '.md')
            .then(mdFiles => {
                if (!mdFiles.length) {
                    return Promise.reject(new Error(`No markdown files found for article ${this.path}`));
                }

                if (mdFiles.length > 1) {
                    const msg = `Found more than 1 markdown file for article ${this.path}.\n` +
                                +`Unable to determine which to use.\n` +
                                +`Files list: ${mdFiles.join(', ')}`;
                    return Promise.reject(new Error(msg));
                }
                return fs.readFile(mdFiles[0]);
            });
    }

    _readResources() {
        return fsu.findFilesOfTypes(this.path, SupportedStaticTypes);
    }
};
