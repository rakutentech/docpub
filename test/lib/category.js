const mockFs = require('mock-fs');
const Promise = require('bluebird');
const Section = require('../../lib/section');
const Category = require('../../lib/category');

describe('Category', () => {
    describe('constructor', () => {
        it('should throw if path is not defined', () => {
            const path = null;

            expect(() => new Category(path)).to.throw(/string/);
        });

        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Category(path)).to.throw(/string/);
        });

        it('should set category type as `category`', () => {
            const category = new Category('some_path');

            expect(category.type).to.be.eql('category');
        });
    });

    describe('read', () => {
        const sandbox = sinon.sandbox.create();

        beforeEach(() => {
            sandbox.stub(Section.prototype, 'read').returns(Promise.resolve());
        });

        afterEach(() => {
            sandbox.restore();
            mockFs.restore();
        });

        it('should load metadata from file named `meta.json`', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}'
            });

            const category = new Category('.');

            return category.read()
                .then(() => {
                    expect(category.meta).to.be.eql({foo: 'bar'});
                });
        });

        it('should create section for each subfolder in category dir', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'section': {},
                'another_section': {}
            });

            const category = new Category('.');

            return category.read()
                .then(() => {
                    expect(category.sections).to.have.length(2); // TODO: verify that created sections are exactly `section` and `another_section`
                });
        });

        it('should start reading contents of each child section', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'section': {},
                'another_section': {}
            });

            const category = new Category('.');

            return category.read()
                .then(() => {
                    expect(Section.prototype.read).to.be.calledTwice;
                });
        });

        it('should link child section with itself', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'section': {}
            });

            const category = new Category('.');

            return category.read()
                .then(() => {
                    const child = category.sections[0];

                    expect(child.category).to.be.equal(category);
                });
        });
    });
});
