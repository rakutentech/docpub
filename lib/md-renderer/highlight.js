const hljs = require('highlight.js');

/**
 * A code highlighting plugin for markdown renderer. Based on highlight.js
 * If language is supported by highlight.js then highlighing is being applied
 * If language is not supported or some error occur during highlighting process,
 * empty string is returned. This will cause markdown renderer to apply default escaping
 * to the code block and render with without highlighting
 * Highlighter does not do any language detection, language must be specified explicitly in
 * markdown.
 * @param  {string} str - a code string to highlight
 * @param  {string} lang - programming language specified in markdown
 * @returns {string} - string with applied formatting (html tags with css classes added)
 */
module.exports = function(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
        try {
            // 3rd param for ignoring illegals - contunue parsing after syntax error in code
            return hljs.highlight(lang, str, true).value;
        /*eslint-disable no-empty*/
        } catch (e) {} // TODO: Add debug output
        /*eslint-enable no-empty*/
    }
    return ''; // use external default escaping
};
