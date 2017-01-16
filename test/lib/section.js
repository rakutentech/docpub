const mockFs = require('mock-fs');
const Section = require('../../lib/section');

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
        afterEach(() => {
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
    });
});
