const mockFs = require('mock-fs');
const Section = require('../../lib/section');
const Category = require('../../lib/category');
const metadata = require('../../lib/metadata');
const Metadata = require('../../lib/metadata/metadata');
const logger = require('../../lib/logger');
const createCategory = require('./test-utils').createCategory;

describe('Category', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Category(path)).to.throw(/string/);
        });

        it('should throw if path empty', () => {
            const path = '';

            expect(() => new Category(path)).to.throw(/empty/);
        });

        it('should set category path as passed path', () => {
            const category = createCategory({path: 'foo'});

            expect(category.path).to.be.equal('foo');
        });

        it('should set category type as `category`', () => {
            const category = createCategory();

            expect(category.type).to.be.eql('category');
        });

        it('should initialise metadata', () => {
            const category = createCategory();

            expect(category.meta).to.be.instanceOf(Metadata);
        });

        it('should initialise metadata for category', () => {
            sandbox.spy(metadata, 'buildForCategory');

            createCategory({path: 'some_path'});

            expect(metadata.buildForCategory).to.be.calledWith('some_path');
        });
    });

    describe('read', () => {
        beforeEach(() => {
            sandbox.stub(Metadata.prototype, 'read').resolves();
            sandbox.stub(Section.prototype, 'read').resolves();

            sandbox.stub(logger, 'info');
        });

        afterEach(() => {
            mockFs.restore();
        });

        it('should log read category action', () => {
            mockFs({});

            const category = createCategory({path: '.'});

            return category.read()
                .then(() => {
                    expect(logger.info).to.be.calledWith(`Reading category .`);
                });
        });

        it('should read metadata', () => {
            mockFs({});

            const category = createCategory({path: '.'});

            return category.read()
                .then(() => {
                    expect(Metadata.prototype.read).to.be.calledOnce;
                });
        });

        it('should create section for each subfolder in category dir', () => {
            mockFs({
                'section': {},
                'another_section': {}
            });

            const category = createCategory({path: '.'});

            return category.read()
                .then(() => {
                    expect(category.sections).to.have.length(2); // TODO: verify that created sections are exactly `section` and `another_section`
                });
        });

        it('should start reading contents of each child section', () => {
            mockFs({
                'section': {},
                'another_section': {}
            });

            const category = createCategory({path: '.'});

            return category.read()
                .then(() => {
                    expect(Section.prototype.read).to.be.calledTwice;
                });
        });

        it('should link child section with itself', () => {
            mockFs({
                'section': {}
            });

            const category = createCategory({path: '.'});

            return category.read()
                .then(() => {
                    const child = category.sections[0];

                    expect(child.category).to.be.equal(category);
                });
        });
    });
});
