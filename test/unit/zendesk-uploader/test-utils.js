const _ = require('lodash');

function createArticle(opts) {
    opts = opts || {};
    const article = _.defaultsDeep(opts, {
        meta: {title: 'Test Article'},
        convertMarkdown: sinon.stub().returns(Promise.resolve('<p>Lorem ipsum dolor sit amet</p>'))
    });
    article.section = opts.section || createSection({
        articles: article,
        meta: {
            id: 123456
        }
    });

    return article;
}

function createSection(opts) {
    opts = opts || {};
    const section = {
        meta: _.defaults(opts.meta || {}, {
            title: 'Test Section'
        })
    };
    section.articles = [].concat(opts.articles || [
        createArticle({section: section}),
        createArticle({section: section})
    ]);
    section.category = opts.category || createCategory({
        sections: section,
        meta: {
            id: 123456
        }
    });

    return section;
}

function createCategory(opts) {
    opts = opts || {};
    const category = {
        meta: _.defaults(opts.meta || {}, {
            title: 'Test Category'
        })
    };
    category.sections = [].concat(opts.sections || [
        createSection({category: category}),
        createSection({category: category})
    ]);

    return category;
}

exports.createArticle = createArticle;
exports.createSection = createSection;
exports.createCategory = createCategory;
