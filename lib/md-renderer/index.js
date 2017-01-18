const MarkdownIt = require('markdown-it');

const highlighter = require('./highlight');

/**
 * Wrapper around markdown-it library.
 * Used to incapsulate markdown-it configuration and provide convenient interface
 */
module.exports = class MarkdownRenderer {
    /**
     * Creates MarkdownRenderer instance.
     */
    constructor() {
        this._renderer = new MarkdownIt({
            highlight: highlighter
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
        markdown = Buffer.isBuffer(markdown)
            ? markdown.toString()
            : markdown;

        if (!markdown || !markdown.length) {
            return '';
        }

        if (typeof markdown !== 'string') {
            throw new Error('Markdown must be passed as string or Buffer');
        }

        return this._renderer.render(markdown);
    }
};
