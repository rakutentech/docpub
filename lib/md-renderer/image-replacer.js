const pluginHelper = require('./plugin-helper');
const Document = require('../document');

const ZENDESK_ATTACHMENTS_PATH = '/hc/article_attachments';

/**
 * Image SRC replacement plugin for Markdown-It
 * The plugin will replace relative image SRCs with the path correct Zendesk attachment ID
 * If the href is a direct link (starts with `http://` or `https://`, or '/'), the plugin will do nothing
 * @param  {object} markdownIt - instance of Markdown-It plugin
 * @param  {Document} document - instance of document that will be used for finding IDs
 * @returns {function} - render function which Markdown-It will use for the applied rule
 */
module.exports = function(markdownIt, document) {
    if (!document || !(document instanceof Document)) {
        throw new Error('You must provide an instance of Document to use for finding IDs');
    }

    const transformer = function(currentSrc) {
        if (currentSrc && pluginHelper.isRelativePath(currentSrc)) {
            const attachmentId = document.findByPath(currentSrc);
            const filename = currentSrc.split('/').pop();
            return `${ZENDESK_ATTACHMENTS_PATH}/${attachmentId}/${filename}`;
        }
        return currentSrc;
    };

    pluginHelper.replaceAttributeValue({
        rule: 'image',
        attribute: 'src',
        transformer: transformer,
        markdownIt: markdownIt
    });
};
