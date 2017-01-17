const Promise = require('bluebird');
const mockFs = require('mock-fs');
const Section = require('../../lib/section');
const Article = require('../../lib/article');

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

        it('should set section type as `section`', () => {
            const category = new Section('some_path');

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

            const section = new Section('.');

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

            const section = new Section('.');

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

            const section = new Section('.');

            return section.read()
                .then(() => {
                    expect(Article.prototype.read).to.be.calledTwice;
                });
        });
    });
});
