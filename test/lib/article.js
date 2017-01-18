const _ = require('lodash');
const mockFs = require('mock-fs');
const Article = require('../../lib/article');
const Section = require('../../lib/section');
const fsu = require('../../lib/fs-utils.js');

describe('Article', () => {
    describe('constructor', () => {
        it('should throw if path is not defined', () => {
            const path = null;

            expect(() => new Article(path)).to.throw(/string/);
        });

        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Article(path)).to.throw(/string/);
        });

        it('should throw if parent section is not passed', () => {
            expect(() => new Article('.')).to.throw(/Missing section/);
        });

        it('should set article type as `article`', () => {
            const category = createArticle_();

            expect(category.type).to.be.eql('article');
        });
    });

    describe('read', () => {
        const sandbox = sinon.sandbox.create();

        afterEach(() => {
            sandbox.restore();
            mockFs.restore();
        });

        it('should load metadata from file named `meta.json`', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.meta).to.be.eql({foo: 'bar'});
                });
        });

        it('should search for .md file with article content', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`
            });
            sandbox.spy(fsu, 'findFilesOfTypes').named('findFilesOfTypes');

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(fsu.findFilesOfTypes).to.be.calledWith('.', '.md');
                });
        });

        it('should reject if unable to find any .md files', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}'
            });

            const article = createArticle_();

            return expect(article.read())
                .to.be.rejectedWith(/No markdown files/);
        });

        it('should reject if found more than 1 .md file', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`,
                'more_content.md': `content_goes_here`
            });

            const article = createArticle_();

            return expect(article.read())
                .to.be.rejectedWith(/more than 1 markdown/);
        });

        it('should search for article resources in `.jpg` format', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`,
                'image.jpg': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources.jpg)
                        .to.have.length(1)
                        .and.to.include('image.jpg');
                });
        });

        it('should search for article resources in `.jpeg` format', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`,
                'image.jpeg': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources.jpeg)
                        .to.have.length(1)
                        .and.to.include('image.jpeg');
                });
        });

        it('should search for article resources in `.png` format', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`,
                'image.png': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources.png)
                        .to.have.length(1)
                        .and.to.include('image.png');
                });
        });

        it('should search for article resources in `.pdf` format', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`,
                'image.pdf': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources.pdf)
                        .to.have.length(1)
                        .and.to.include('image.pdf');
                });
        });

        it('should search for all available resources in same time', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'content.md': `content_goes_here`,
                'image.jpg': 'image_bytes_here',
                'image.jpeg': 'image_bytes_here',
                'image.png': 'image_bytes_here',
                'image.pdf': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.be.eql({
                        jpg: ['image.jpg'],
                        jpeg: ['image.jpeg'],
                        png: ['image.png'],
                        pdf: ['image.pdf']
                    });
                });
        });
    });
});

function createArticle_(opts) {
    opts = _.defaults(opts || {}, {
        path: '.',
        section: sinon.createStubInstance(Section)
    });

    return new Article(opts.path, opts.section);
}
