const _ = require('lodash');

function createArticle(opts) {
    opts = opts || {};
    const article = _.defaultsDeep(opts, {
        type: 'article',
        meta: {
            title: 'Test Article',
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        convertMarkdown: sinon.stub().resolves('<p>Lorem ipsum dolor sit amet</p>'),
        isChanged: sinon.stub().resolves(true)
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
        meta: {
            title: 'Test Section',
            viewableBy: 'everyone',
            manageableBy: 'staff',
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        isChanged: sinon.stub().resolves(true)
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
        meta: {
            title: 'Test Category',
            update: sinon.stub().returns(),
            write: sinon.stub().resolves()
        },
        isChanged: sinon.stub().resolves(true)
    });
    category.sections = [].concat(opts.sections || [
        createSection({category: category}),
        createSection({category: category})
    ]);

    return category;
}

exports.createArticle = createArticle;
exports.createSection = createSection;
exports.createCategory = createCategory;
