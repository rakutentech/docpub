const _ = require('lodash');
const Promise = require('bluebird');
const mockFs = require('mock-fs');
const Section = require('../../lib/section');
const Article = require('../../lib/article');
const Category = require('../../lib/category');

describe('Section', () => {
    describe('constructor', () => {
        it('should throw if path is not defined', () => {
            const path = null;

            expect(() => new Section(path)).to.throw(/string/);
        });

        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Section(path)).to.throw(/string/);
        });

        it('should throw if parent category is not passed', () => {
            expect(() => new Section('.')).to.throw(/Missing parent category/);
        });

        it('should set section type as `section`', () => {
            const category = createSection_();

            expect(category.type).to.be.eql('section');
        });
    });

    describe('read', () => {
        const sandbox = sinon.sandbox.create();

        beforeEach(() => {
            sandbox.stub(Article.prototype, 'read').returns(Promise.resolve());
        });

        afterEach(() => {
            sandbox.restore();
            mockFs.restore();
        });

        it('should load metadata from file named `meta.json`', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}'
            });

            const section = createSection_();

            return section.read()
                .then(() => {
                    expect(section.meta).to.be.eql({foo: 'bar'});
                });
        });

        it('should create article for each subfolder in section dir', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'article': {},
                'another_article': {}
            });

            const section = createSection_();

            return section.read()
                .then(() => {
                    expect(section.articles).to.have.length(2); // TODO: verify that created articles are exactly `article` and `another_article`
                });
        });

        it('should start reading contents of each child article', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'article': {},
                'another_article': {}
            });

            const section = createSection_();

            return section.read()
                .then(() => {
                    expect(Article.prototype.read).to.be.calledTwice;
                });
        });

        it('should link child article with itself', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'article': {}
            });

            const section = createSection_();

            return section.read()
                .then(() => {
                    const child = section.articles[0];

                    expect(child.section).to.be.equal(section);
                });
        });
    });
});

function createSection_(opts) {
    opts = _.defaults(opts || {}, {
        path: '.',
        category: sinon.createStubInstance(Category)
    });

    return new Section(opts.path, opts.category);
}
