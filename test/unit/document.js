const _ = require('lodash');
const Document = require('../../lib/document');

describe('Document', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

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

    describe('isNew', () => {
        it('should return false if document has no meta defined', () => {
            const document = new Document('path');

            expect(document.isNew).to.be.false;
        });

        it('should return true if document has zendeskId equal to 0', () => {
            const document = new Document('path');
            document.meta = {zendeskId: 0};

            expect(document.isNew).to.be.true;
        });

        it('should return false if document has zendeskId different from 0', () => {
            const document = new Document('path');
            document.meta = {zendeskId: 123456};

            expect(document.isNew).to.be.false;
        });
    });

    describe('isChanged', () => {
        it('should return false if document has no meta defined', () => {
            const document = new Document('path');

            expect(document.isChanged).to.be.false;
        });

        it('should return true if document hash differes from document meta.userMetaHash', () => {
            const document = new Document('path');

            Object.defineProperty(document, 'hash', {value: 'abcdef'});
            document.meta = {hash: `a0b1c2`};

            expect(document.isChanged).to.be.true;
        });

        it('should return false if document has same hash and meta.userMetaHash', () => {
            const document = new Document('path');

            Object.defineProperty(document, 'hash', {value: 'abcdef'});
            document.meta = {hash: `abcdef`};

            expect(document.isChanged).to.be.false;
        });
    });

    describe('hash', () => {
        it('should return empty string if document has no meta defined', () => {
            const document = new Document('path');

            expect(document.hash).to.be.equal('');
        });

        it('should return user meta hash if meta defined', () => {
            const document = new Document('path');

            document.meta = {userMetaHash: 'abcdef'};

            expect(document.hash).to.be.equal('abcdef');
        });
    });

    describe('read', () => {
        it('should read metadata', () => {
            const doc = new Document('some_path');
            doc.meta = {read: sandbox.stub().resolves()};

            return doc.read()
                .then(() => {
                    expect(doc.meta.read).to.be.calledOnce;
                });
        });
    });

    describe('updateHash', () => {
        it('should update hash in meta with own hash', () => {
            const document = new Document('path');

            document.meta = buildMeta_('abcdef');

            return document.updateHash()
                .then(() => {
                    expect(document.meta.update)
                        .to.be.calledWith({hash: 'abcdef'});
                });
        });

        it('should write updated meta to the disc', () => {
            const document = new Document('path');

            document.meta = buildMeta_();

            return document.updateHash()
                .then(() => {
                    expect(document.meta.write)
                        .to.be.calledOnce;
                });
        });

        it('should reject if error happened on meta write', () => {
            const document = new Document('path');
            const error = new Error('error');

            document.meta = buildMeta_();
            document.meta.write.rejects(error);

            return expect(document.updateHash())
                .to.be.rejectedWith(error);
        });

        function buildMeta_(hash) {
            return {
                update: sandbox.stub(),
                write: sandbox.stub().resolves(),
                userMetaHash: hash || 'defaultHash'
            };
        }
    });

    describe('setChildren', () => {
        it('should throw if any of children is not instance of Document', () => {
            const document = new Document('path');

            expect(() => document.setChildren([{}])).to.throw(/Document/);
        });

        it('should set children of the document', () => {
            const document = new Document('path');
            const child = new Document('another_path');

            child.meta = {zendeskId: 123};
            document.setChildren([child]);

            expect(document.findByPath('another_path')).to.be.equal(123);
        });

        it('should remove children if called with falsy argument', () => {
            const document = new Document('path');
            const child = new Document('another_path');

            child.meta = {zendeskId: 123};
            document.setChildren([child]);
            document.setChildren();

            expect(document.findByPath('another_path')).to.be.undefined;
        });
    });

    describe('findByPath', () => {
        it('should return zendeskId of entity for corresponding path in tree', () => {
            const document = buildDocumentTree_({id: 123});

            expect(document.findByPath('')).to.be.eql(123);
        });

        it('should accept path as array of components', () => {
            const document = buildDocumentTree_({id: 123});

            expect(document.findByPath([])).to.be.eql(123);
        });

        it('should refer child when path contains string name', () => {
            const document = buildDocumentTree_({
                id: 123,
                children: [{
                    id: 456,
                    path: 'bar'
                }]
            });

            expect(document.findByPath('bar')).to.be.eql(456);
        });

        it('should refer to self when path contains `.`', () => {
            const document = buildDocumentTree_({
                id: 123
            });

            expect(document.findByPath('.')).to.be.eql(123);
        });

        it('should refer to parent when path contains `..`', () => {
            const document = buildDocumentTree_({
                id: 123,
                children: [{
                    id: 456,
                    path: 'bar'
                }]
            });

            expect(document.findByPath('bar/..')).to.be.eql(123);
        });

        it('should navigate by complex path with all special components presented', () => {
            const document = buildDocumentTree_({
                id: 123,
                children: [
                    {
                        id: 456,
                        path: 'bar'
                    },
                    {
                        id: 789,
                        path: 'baz'
                    }
                ]
            });
            const pathToSearch = './baz/../bar/.././bar';

            expect(document.findByPath(pathToSearch)).to.be.eql(456);
        });

        it('should ignore multiple `/` delimiters', () => {
            const document = buildDocumentTree_({id: 123});

            expect(document.findByPath('.//')).to.be.equal(123);
        });

        it('should return own zendeskId for empty path', () => {
            const document = buildDocumentTree_({id: 123});

            expect(document.findByPath()).to.be.equal(123);
        });
    });

    describe('flatTree', () => {
        it('should add document to documents list', () => {
            const document = new Document('.');
            const result = document.flatTree();

            expect(result).to.include(document);
        });

        it('should include document`s children to the list', () => {
            const document = new Document('doc');
            const child = new Document('child');
            const anotherChild = new Document('another_child');

            document.setChildren([child, anotherChild]);

            const result = document.flatTree();

            expect(result).to.include(child)
                .and.to.include(anotherChild);
        });

        it('should recursively include children of own children', () => {
            const root = new Document('parent');
            let currentChild = root;

            const children = [];
            for (let i = 0; i < 100; i++) {
                const child = new Document(`child_${i}`);
                currentChild.setChildren([child]);
                children.push(child);
                currentChild = child;
            }

            const result = root.flatTree();

            expect(result.length).to.be.equal(101); // because parent also included
            children.forEach(child => expect(result).to.include(child));
        });
    });
});

function buildDocumentTree_(scheme, parent) {
    scheme = _.defaults(scheme || {}, {
        id: 1,
        path: 'default_path',
        children: []
    });

    const document = documentForScheme_(scheme, parent);

    document.setChildren(scheme.children.map(childScheme => buildDocumentTree_(childScheme, document)));

    return document;
}

function documentForScheme_(scheme, parent) {
    const document = new Document(scheme.path, parent);

    document.meta = {zendeskId: scheme.id};

    return document;
}
