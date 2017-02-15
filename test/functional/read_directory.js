const Category = require('../../lib/category');
const MarkdownRenderer = require('../../lib/md-renderer');
const path = require('path');

describe('Documentation directory reading', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('correct folder', () => {
        const dirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/correct/with-system-meta');

        it('should read directory without errors', () => {
            const category = new Category(dirPath);

            return expect(category.read()).to.be.fulfilled;
        });

        it('should successfully read directory without .meta.md files', () => {
            const missingMetaPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/correct/without-system-meta');
            const category = new Category(missingMetaPath);

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

        it('should correctly read user metadata for each entity', () => {
            const category = new Category(dirPath);

            return category.read()
                .then(() => {
                    expect(category.meta).to.have.property('title', 'category_title');
                    expect(category.meta).to.have.property('description', 'category_description');
                    expect(category.meta).to.have.property('position', 1);
                    expect(category.meta).to.have.property('locale', 'en-us');

                    const section = category.sections[0];
                    expect(section.meta).to.have.property('title', 'section_title');
                    expect(section.meta).to.have.property('description', 'section_description');
                    expect(section.meta).to.have.property('position', 1);
                    expect(section.meta).to.have.property('locale', 'en-us');
                    expect(section.meta).to.have.property('viewableBy', 'everybody');
                    expect(section.meta).to.have.property('manageableBy', 'staff');

                    const article = section.articles[0];
                    expect(article.meta).to.have.property('title', 'article_title');
                    expect(article.meta.labels).to.be.eql(['label', 'another label']); // property syntax checks equal, not eql
                    expect(article.meta).to.have.property('position', 1);
                    expect(article.meta).to.have.property('locale', 'en-us');
                });
        });

        it('should correctly read system metadata for each entity', () => {
            const category = new Category(dirPath);

            return category.read()
                .then(() => {
                    expect(category.meta).to.have.property('zendeskId', 1);
                    expect(category.meta).to.have.property('hash', 'abcdef');

                    const section = category.sections[0];
                    expect(section.meta).to.have.property('zendeskId', 1);
                    expect(section.meta).to.have.property('hash', 'abcdef');

                    const article = section.articles[0];
                    expect(section.meta).to.have.property('zendeskId', 1);
                    expect(section.meta).to.have.property('hash', 'abcdef');
                    expect(article.meta.resources).to.be.eql({
                        'picture.jpg': {
                            'zendeskId': 2,
                            'hash': 'abcdef'
                        }
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

                    expect(article.resources).to.have.length(4);

                    const paths = article.resources.map(resource => resource.path);
                    expect(paths)
                        .to.match(/section\/article\/document.pdf/)
                        .and.to.match(/section\/article\/picture.jpg/)
                        .and.to.match(/section\/article\/picture.jpeg/)
                        .and.to.match(/section\/article\/picture.png/);

                    return article.convertMarkdown();
                })
                .then(() => {
                    // Extracting arg because sinon-chai unable unable to match buffers
                    const bufferArg = MarkdownRenderer.prototype.render
                        .lastCall.args[0];

                    expect(bufferArg).to.be.eql(Buffer('Content in markdown\n'));
                });
        });
    });

    describe('broken folder', () => {
        const brokenDirPath = path.resolve(__dirname, 'fixtures/documentation-folder-structure/broken/');

        it('should fail if category meta missing', () => {
            const dirPath = path.resolve(brokenDirPath, 'missing-category-meta');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/missing-category-meta\/meta.json does not exist/);
        });

        it('should fail if section meta is missing', () => {
            const dirPath = path.resolve(brokenDirPath, 'missing-section-meta');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/missing-section-meta\/section\/meta.json does not exist/);
        });

        it('should fail if article meta is missing', () => {
            const dirPath = path.resolve(brokenDirPath, 'missing-article-meta');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/missing-article-meta\/section\/article\/meta.json does not exist/);
        });

        it('should fail if markdown file is not presented in article folder', () => {
            const dirPath = path.resolve(brokenDirPath, 'missing-article-md');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/No markdown files found/);
        });

        it('should fail if found more then one markdown file for article', () => {
            const dirPath = path.resolve(brokenDirPath, 'multiple-article-md');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/Found more than 1 markdown file/);
        });

        it('should fail if title missed in meta.json', () => {
            const dirPath = path.resolve(brokenDirPath, 'missing-meta-title');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/title/);
        });

        it('should fail if meta.json contains something else than expected properties', () => {
            const dirPath = path.resolve(brokenDirPath, 'unknown-meta-key');
            const category = new Category(dirPath);

            return expect(category.read())
                .to.be.rejectedWith(/foo/);
        });
    });
});
