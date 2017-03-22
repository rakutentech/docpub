const _ = require('lodash');
const mockFs = require('mock-fs');
const Section = require('../../lib/section');
const Article = require('../../lib/article');
const Category = require('../../lib/category');
const metadata = require('../../lib/metadata');
const Metadata = require('../../lib/metadata/metadata');
const logger = require('../../lib/logger');
const createDummyConfig = require('./test-utils').createDummyConfig;

describe('Section', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Section(path)).to.throw(/string/);
        });

        it('should throw if path empty', () => {
            const path = '';

            expect(() => new Section(path)).to.throw(/empty/);
        });

        it('should throw if parent category is not passed', () => {
            expect(() => new Section('.', createDummyConfig())).to.throw(/Missing parent category/);
        });

        it('should set passed path as section path', () => {
            const section = createSection_({path: 'foo'});

            expect(section.path).to.be.equal('foo');
        });

        it('should set parent category as passed category', () => {
            const category = sinon.createStubInstance(Category);
            const section = createSection_({category: category});

            expect(section.category).to.be.equal(category);
        });

        it('should set section type as `section`', () => {
            const section = createSection_();

            expect(section.type).to.be.eql('section');
        });

        it('should initialise metadata', () => {
            const section = createSection_();

            expect(section.meta).to.be.instanceOf(Metadata);
        });

        it('should initialise metadata for section', () => {
            sandbox.spy(metadata, 'buildForSection');

            createSection_({path: 'some_path'});

            expect(metadata.buildForSection).to.be.calledWith('some_path');
        });
    });

    describe('read', () => {
        beforeEach(() => {
            sandbox.stub(Article.prototype, 'read').resolves();
            sandbox.stub(Metadata.prototype, 'read').resolves();

            sandbox.stub(logger, 'info');
        });

        afterEach(() => {
            mockFs.restore();
        });

        it('should log read section action', () => {
            mockFs({});

            const section = createSection_();

            return section.read()
                .then(() => {
                    expect(logger.info).to.be.calledWith(`Reading section .`);
                });
        });

        it('should load metadata', () => {
            mockFs({});

            const section = createSection_();

            return section.read()
                .then(() => {
                    expect(Metadata.prototype.read).to.be.called;
                });
        });

        it('should create article for each subfolder in section dir', () => {
            mockFs({
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

function createSection_(opts, config) {
    opts = _.defaults(opts || {}, {
        path: '.',
        category: sinon.createStubInstance(Category)
    });

    return new Section(opts.path, createDummyConfig(config), opts.category);
}
