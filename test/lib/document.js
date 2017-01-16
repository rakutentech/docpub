const mockFs = require('mock-fs');
const Document = require('../../lib/document');

describe('Document', () => {
    describe('constructor', () => {
        it('should throw if path is not defined', () => {
            const path = null;

            expect(() => new Document(path)).to.throw(/string/);
        });

        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Document(path)).to.throw(/string/);
        });

        it('should set document type as `generic_document`', () => {
            const doc = new Document('some_path');

            expect(doc.type).to.be.eql('generic_document');
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

            const document = new Document('.');

            return document.read()
                .then(() => {
                    expect(document.meta).to.be.eql({foo: 'bar'});
                });
        });

        it('should resolve with paths to subfolders', () => {
            mockFs({
                'meta.json': '{"foo":"bar"}',
                'folder': {},
                'another_folder': {}
            });

            const document = new Document('.');

            return document.read()
                .then((paths) => {
                    expect(paths).to.have.length(2)
                        .and.to.include('folder')
                        .and.to.include('another_folder');
                });
        });

        it('should reject if was unable to find metadata file named `meta.json`', () => {
            mockFs({
                'wrong.meta.json': '{"foo":"bar"}'
            });

            const document = new Document('.');

            return expect(document.read()).to.be.rejectedWith(/does not exist/);
        });

        it('should reject if was unable to parse metadata', () => {
            mockFs({
                'meta.json': 'broken_data_here'
            });

            const document = new Document('.');

            return expect(document.read())
                .to.be.rejectedWith(/JSON/);
        });
    });
});
