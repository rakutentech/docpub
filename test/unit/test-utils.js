const _ = require('lodash');
const Document = require('../../lib/document');

function createDocument(opts) {
    opts = _.defaults(opts || {}, {
        path: 'path',
        parent: new Document('parent', getConfigFromOpts(opts))
    });

    return new Document(opts.path, getConfigFromOpts(opts), opts.parent);
}

function getConfigFromOpts(opts) {
    return opts && opts.config
        ? createDummyConfig(opts.config)
        : createDummyConfig();
}

function createDummyConfig(params) {
    return _.defaults(params || {}, {
        username: 'default_username',
        token: 'default_token',
        url: 'default_url',
        renderer: {
            highlight: true
        }
    });
}

exports.createDocument = createDocument;
exports.createDummyConfig = createDummyConfig;
