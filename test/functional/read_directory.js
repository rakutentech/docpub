const Category = require('../../lib/category');
const MarkdownRenderer = require('../../lib/md-renderer');
const path = require('path');

describe('Documentation directory reading', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('correct folder', () => {
        const dirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/correct');

        it('should read directory without errors', () => {
            const category = new Category(dirPath);

            return expect(category.read()).to.be.fulfilled;
        });

        it('should build correct directory structure', () => {
            const category = new Category(dirPath);

            return category.read()
                .then(() => {
                    expect(category.sections).to.have.length(1);

                    const section = category.sections[0];
                    expect(section.category).to.be.equal(category);
                    expect(section.articles).to.have.length(1);

                    const article = section.articles[0];
                    expect(article.section).to.be.equal(section);
                });
        });

        it('should correctly read metadata for each entity', () => {
            const category = new Category(dirPath);

            return category.read()
                .then(() => {
                    expect(category.meta).to.be.eql({
                        title: 'category_title',
                        description: 'category_description'
                    });

                    const section = category.sections[0];
                    expect(section.meta).to.be.eql({
                        title: 'section_title',
                        description: 'section_description'
                    });

                    const article = section.articles[0];
                    expect(article.meta).to.be.eql({
                        title: 'article_title',
                        description: 'article_description'
                    });
                });
        });

        it('should correctly read article resources and content', () => {
            const category = new Category(dirPath);
            sandbox.spy(MarkdownRenderer.prototype, 'render');

            return category.read()
                .then(() => {
                    const section = category.sections[0];
                    const article = section.articles[0];

                    expect(article.resources).to.be.eql({
                        pdf: [path.resolve(dirPath, 'section/article/document.pdf')],
                        jpg: [path.resolve(dirPath, 'section/article/picture.jpg')],
                        jpeg: [path.resolve(dirPath, 'section/article/picture.jpeg')],
                        png: [path.resolve(dirPath, 'section/article/picture.png')]
                    });

                    return article.convertMarkdown();
                })
                .then(() => {
                    // Extracting arg because sinon-chai unable unable to match buffers
                    const bufferArg = MarkdownRenderer.prototype.render
                        .lastCall.args[0];

                    expect(bufferArg).to.be.eql(Buffer('# Content in markdown\n'));
                });
        });
    });

    describe('broken folder', () => {
        it('should fail if category meta missing', () => {
            const dirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/missing-category-meta');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/missing-category-meta\/meta.json does not exist/);
        });

        it('should fail if section meta is missing', () => {
            const dirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/missing-section-meta');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/missing-section-meta\/section\/meta.json does not exist/);
        });

        it('should fail if article meta is missing', () => {
            const dirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/missing-article-meta');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/missing-article-meta\/section\/article\/meta.json does not exist/);
        });

        it('should fail if markdown file is not presented in article folder', () => {
            const dirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/missing-article-md');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/No markdown files found/);
        });

        it('should fail if found more then one markdown file for article', () => {
            const dirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/multiple-article-md');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/Found more than 1 markdown file/);
        });
    });
});
