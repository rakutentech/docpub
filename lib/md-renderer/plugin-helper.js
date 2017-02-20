const ATTRIBUTE_VALUE = 1;

/**
 * Replaces an attribute value for a given rule using the given transformer
 * The returned rule will also contain the function for the previous rule
 * @param  {object} opts.rule - the rule that will be replaced or created
 * @param {string} opts.attribute - the attribute that will be replaced or created on the token
 * @param {function} opts.transformer - the function that will transform the provided value and return a new value
 * @returns {function} the new render function for the rule - this can replace the old rule in your Markdown-It instance
 */
function replaceAttributeValue(opts) {
    if (typeof opts.transformer !== 'function') {
        throw new Error('Transformer must be a function.');
    }

    const {rule, attribute, transformer, markdownIt} = opts;
    const rules = markdownIt.renderer.rules;

    const defaultRender = rules[rule] || function(tokens, idx, options, env, renderer) {
        return renderer.renderToken(tokens, idx, options);
    };

    rules[rule] = (tokens, idx, options, env, renderer) => {
        const token = tokens[idx];
        const original = getAttributeValue(attribute, token);
        const transformed = transformer(original);

        if (transformed) {
            setAttributeValue(attribute, transformed, token);
        }

        return defaultRender(tokens, idx, options, env, renderer);
    };
}

/**
 * Returns true if the path is relative (doesn't start with 'http://', 'https://', '/', '#', or 'mailto:')
 * @param  {string} path - the path to check
 * @returns {boolean} true if the path is relative
 */
function isRelativePath(path) {
    return !path.match(/^((http:\/\/)|(https:\/\/)|(\/)|(#)|(mailto:))/);
}

function getAttributeValue(key, token) {
    if (token.attrIndex && token.attrIndex(key) > -1) {
        const index = token.attrIndex(key);
        return token.attrs[index][ATTRIBUTE_VALUE];
    }
    return null;
}

function setAttributeValue(key, value, token) {
    if (token.attrIndex && token.attrIndex(key) > -1) {
        const index = token.attrIndex(key);
        token.attrs[index][ATTRIBUTE_VALUE] = value;
    } else {
        token.attrPush([key, value]);
    }
}

module.exports = {
    replaceAttributeValue,
    isRelativePath
};
