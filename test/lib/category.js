const mockFs = require('mock-fs');
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
        afterEach(() => {
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
    });
});
