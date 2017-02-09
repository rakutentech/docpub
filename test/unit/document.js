const Document = require('../../lib/document');

describe('Document', () => {
    describe('constructor', () => {
        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Document(path)).to.throw(/string/);
        });

        it('should throw if path empty', () => {
            const path = '';

            expect(() => new Document(path)).to.throw(/empty/);
        });

        it('should throw if parent is not instance of Document', () => {
            expect(() => new Document('path', {})).to.throw(/Document/);
        });

        it('should set passed path', () => {
            const doc = new Document('some_path');

            expect(doc.path).to.be.equal('some_path');
        });

        it('should set document type as `generic_document`', () => {
            const doc = new Document('some_path');

            expect(doc.type).to.be.eql('generic_document');
        });
    });

    describe('read', () => {
        const sandbox = sinon.sandbox.create();

        afterEach(() => {
            sandbox.restore();
        });

        it('should read metadata', () => {
            const doc = new Document('some_path');
            doc.meta = {read: sandbox.stub().resolves()};

            return doc.read()
                .then(() => {
                    expect(doc.meta.read).to.be.calledOnce;
                });
        });
    });
});
