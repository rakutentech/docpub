const pluginHelper = require('./plugin-helper');
const Document = require('../document');

const ZENDESK_ARTICLES_PATH = '/hc/articles';

/**
 * Link HREF replacement plugin for Markdown-It
 * The plugin will replace relative link HREFs with the path to the correct Zendesk article ID
 * If the href is a direct link (starts with `http://`, `https://`, '/', or '#'), the plugin will do nothing
 * @param  {object} markdownIt - instance of Markdown-It plugin
 * @param  {Document} document - instance of document that will be used for finding IDs
 * @returns {function} - render function which Markdown-It will use for the applied rule
 */
module.exports = function(markdownIt, document) {
    if (!document || !(document instanceof Document)) {
        throw new Error('You must provide an instance of Document to use for finding IDs');
    }

    const transformer = function(currentHref) {
        if (currentHref && pluginHelper.isRelativePath(currentHref)) {
            const articleId = document.findByPath(currentHref);
            return `${ZENDESK_ARTICLES_PATH}/${articleId}`;
        }
        return currentHref;
    };

    pluginHelper.replaceAttributeValue({
        rule: 'link_open',
        attribute: 'href',
        transformer: transformer,
        markdownIt: markdownIt
    });
};
