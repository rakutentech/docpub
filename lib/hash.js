const crypto = require('crypto');

/**
 * Helper for calculating hash of arbitrary string or Buffer.
 * Uses sha1 as hasing algorithm. Implemented as a wrapper around crypto module.
 * Returns hash represented as hex digits.
 * Function accepts string or Buffer as input. If received something different, exception will be thrown.
 *
 * @param  {string|Buffer} content - content needs to be hashed.
 * @return {string} - hash represented as hex string.
 */
module.exports = function(content) {
    if (typeof content !== 'string' && !Buffer.isBuffer(content)) {
        throw new Error('Content must be either string or Buffer');
    }

    const hash = crypto.createHash('sha1');

    return hash.update(content).digest('hex');
};
