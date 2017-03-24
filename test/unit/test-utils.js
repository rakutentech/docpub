const _ = require('lodash');
const Document = require('../../lib/document');
const Article = require('../../lib/article');
const Section = require('../../lib/section');
const Category = require('../../lib/category');

function createDocument(opts) {
    opts = opts || {};
    opts = _.defaults(opts, {
        path: 'path'
    });

    return new Document(opts.path, createDummyConfig(opts.config), opts.parent);
}

function createArticle(opts) {
    opts = opts || {};
    opts = _.defaults(opts, {
        path: '.',
        section: sinon.createStubInstance(Section)
    });

    return new Article(opts.path, createDummyConfig(opts.config), opts.section);
}

function createSection(opts) {
    opts = opts || {};
    opts = _.defaults(opts, {
        path: '.',
        category: sinon.createStubInstance(Category)
    });

    return new Section(opts.path, createDummyConfig(opts.config), opts.category);
}

function createCategory(opts) {
    opts = opts || {};
    opts = _.defaults(opts, {
        path: 'path'
    });

    return new Category(opts.path, createDummyConfig(opts.config));
}

function createDummyDocument(opts) {
    opts = opts || {};
    const document = _.defaultsDeep(opts, {
        type: 'document',
        path: 'document_path',
        meta: {
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        isChanged: false,
        isNew: false,
        updateHash: sinon.stub().resolves(),
        flatTree: sinon.stub().returns([])
    });

    return document;
}

function createDummyArticle(opts) {
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
    article.section = opts.section || createDummySection({
        articles: article,
        meta: {
            zendeskId: 123456
        }
    });

    return article;
}

function createDummySection(opts) {
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
        createDummyArticle({section: section}),
        createDummyArticle({section: section})
    ]);
    section.category = opts.category || createDummyCategory({
        sections: section,
        meta: {
            zendeskId: 123456
        }
    });

    return section;
}

function createDummyCategory(opts) {
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
        createDummySection({category: category}),
        createDummySection({category: category})
    ]);

    return category;
}

function createDummyResource(opts) {
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
        url: 'default_url',
        rendering: {
            highlight: true
        }
    });
}

exports.createDocument = createDocument;
exports.createArticle = createArticle;
exports.createSection = createSection;
exports.createCategory = createCategory;
exports.createDummyDocument = createDummyDocument;
exports.createDummyArticle = createDummyArticle;
exports.createDummySection = createDummySection;
exports.createDummyCategory = createDummyCategory;
exports.createDummyResource = createDummyResource;
exports.createDummyConfig = createDummyConfig;
