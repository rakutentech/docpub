const MarkdownIt = require('markdown-it');

const highlighter = require('./highlight');
const tocPlugin = require('markdown-it-github-toc');
const linkReplacer = require('./link-replacer');
const imageReplacer = require('./image-replacer');

/**
 * Wrapper around markdown-it library.
 * Used to incapsulate markdown-it configuration and provide convenient interface
 */
module.exports = class MarkdownRenderer {
    /**
     * Creates MarkdownRenderer instance.
     */
    constructor(document) {
        this._renderer = new MarkdownIt({
            highlight: highlighter
        });

        this._renderer.use(linkReplacer, document);
        this._renderer.use(imageReplacer, document);

        this._renderer.use(tocPlugin, { // FIXME: Renders <ul> inside <p>, what is broken markup
            // Defaults from @Adher
            tocFirstLevel: 2,
            tocLastLevel: 6
        });
    }

    /**
     * Renderes html representation of markdown.
     * Markdown may be passed either as string or as Buffer.
     * If markdown is not a string or buffer, exception will be thrown.
     * If markdown is not passed, empty string will be returned.
     * If markdown is empty, empty string will be returned.
     * If any error will occur during rendering, exception will be thrown.
     *
     * @param {string|Buffer} markdown - Markdown string to render
     *
     * @returns {string} - html representation of markdown input.
     */
    render(markdown) {
        if (!markdown) {
            return '';
        }

        if (typeof markdown !== 'string' && !(markdown instanceof Buffer)) {
            throw new Error('Markdown must be passed as string or Buffer');
        }

        markdown = Buffer.isBuffer(markdown)
            ? markdown.toString()
            : markdown;

        return this._renderer.render(markdown);
    }
};
