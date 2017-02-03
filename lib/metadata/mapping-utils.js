const _ = require('lodash');

/**
 * Mapping helper for labels. Accepts either array of strings or comma-separated string.
 * Trims each label. Removes duplicate labels and empty (falsy) labels.
 * @param  {string|string[]} labels - labels to map
 * @return {string[]} - array of mapped labelss
 */
function mapLabels(labels) {
    if (typeof labels === 'string') {
        labels = _.split(labels, ',');
    }

    return _(labels)
        .map(_.trim)
        .uniq()
        .compact()
        .value();
}

module.exports = {
    mapLabels
};
