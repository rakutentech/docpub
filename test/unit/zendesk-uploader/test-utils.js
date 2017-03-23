const _ = require('lodash');

function createArticle(opts) {
    opts = opts || {};
    const article = _.defaultsDeep(opts, {
        type: 'article',
        path: 'article_path',
        meta: {
            title: 'Test Article',
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        convertMarkdown: sinon.stub().resolves('<p>Lorem ipsum dolor sit amet</p>'),
        isChanged: false,
        isNew: false,
        updateHash: sinon.stub().resolves()
    });
    article.section = opts.section || createSection({
        articles: article,
        meta: {
            zendeskId: 123456
        }
    });

    return article;
}

function createSection(opts) {
    opts = opts || {};
    const section = _.defaultsDeep(opts, {
        type: 'section',
        path: 'section_path',
        meta: {
            title: 'Test Section',
            viewableBy: 'everyone',
            manageableBy: 'staff',
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        isChanged: false,
        isNew: false,
        updateHash: sinon.stub().resolves()
    });
    section.articles = [].concat(opts.articles || [
        createArticle({section: section}),
        createArticle({section: section})
    ]);
    section.category = opts.category || createCategory({
        sections: section,
        meta: {
            zendeskId: 123456
        }
    });

    return section;
}

function createCategory(opts) {
    opts = opts || {};
    const category = _.defaultsDeep(opts, {
        type: 'category',
        path: 'category_path',
        meta: {
            title: 'Test Category',
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        isChanged: true,
        isNew: false,
        updateHash: sinon.stub().resolves(),
        flatTree: sinon.stub().returns([])
    });
    category.sections = [].concat(opts.sections || [
        createSection({category: category}),
        createSection({category: category})
    ]);

    return category;
}

function createResource(opts) {
    opts = opts || {};
    const resource = _.defaultsDeep(opts, {
        path: 'test.jpg',
        type: 'resource',
        meta: {
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        isChanged: false,
        isNew: false
    });

    return resource;
}

function createDummyConfig(params) {
    return _.defaults(params || {}, {
        username: 'default_username',
        token: 'default_token',
        url: 'default_url'
    });
}

exports.createArticle = createArticle;
exports.createSection = createSection;
exports.createCategory = createCategory;
exports.createResource = createResource;
exports.createDummyConfig = createDummyConfig;
