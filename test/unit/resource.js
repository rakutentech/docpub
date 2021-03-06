const _ = require('lodash');
const mockFs = require('mock-fs');
const Resource = require('../../lib/resource');
const Article = require('../../lib/article');
const Document = require('../../lib/document');
const ResourceMetadata = require('../../lib/metadata/resource-metadata');
const createDummyConfig = require('./test-utils').createDummyConfig;

const hash = require('../../lib/hash');
const fs = require('fs-promise');

describe('Resource', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Resource(path)).to.throw(/string/);
        });

        it('should throw if path empty', () => {
            const path = '';

            expect(() => new Resource(path)).to.throw(/empty/);
        });

        it('should throw if parent is not defined', () => {
            expect(() => new Resource('foo', createDummyConfig())).to.throw(/article/);
        });

        it('should throw if parent is not a Document', () => {
            const article = {};

            expect(() => new Resource('path', createDummyConfig(), article)).to.throw(/Document/);
        });

        it('should throw if parent is other Document then Article', () => {
            const parent = new Document('path', createDummyConfig());

            expect(() => new Resource('path', createDummyConfig(), parent)).to.throw(/article/);
        });

        it('should return it`s parent as article', () => {
            const article = new Article('foo', createDummyConfig(), new Document('path', createDummyConfig()));
            const resource = createResource_({article: article});

            expect(resource.article).to.be.equal(article);
        });

        it('should set it`s type as `resource`', () => {
            const resource = createResource_();

            expect(resource.type).to.be.equal('resource');
        });

        it('should set it`s meta as instance of `ResourceMetadata`', () => {
            const resource = createResource_();

            expect(resource.meta).to.be.instanceOf(ResourceMetadata);
        });
    });

    describe('hash', () => {
        afterEach(() => {
            mockFs.restore();
        });

        it('should return empty string if resource contents were not read', () => {
            const resource = createResource_();

            expect(resource.hash).to.be.equal('');
        });

        it('should return content hash if resource contents were read', () => {
            mockFs({
                dir: {
                    'res.ext': 'resource_contents'
                }
            });
            const resource = createResource_({path: 'dir/res.ext'});
            const expectedHash = hash('resource_contents');

            return resource.read()
                .then(() => {
                    expect(resource.hash).to.be.equal(expectedHash);
                });
        });
    });

    describe('read', () => {
        it('should reject if error on resource reading happened', () => {
            const resource = createResource_({path: 'path'});
            const error = new Error('error');

            sandbox.stub(fs, 'readFile').rejects(error);

            return expect(resource.read())
                .to.be.rejectedWith(error);
        });

        it('should calculate hash of resource contents', () => {
            mockFs({
                'res.ext': 'resource_contents'
            });
            const resource = createResource_({path: 'res.ext'});
            const expectedHash = hash('resource_contents');

            return resource.read()
                .then(() => {
                    expect(resource.hash).to.be.equal(expectedHash);
                });
        });
    });

    describe('updateHash', () => {
        it('should update meta with own hash', () => {
            const resource = createResource_();

            Object.defineProperty(resource, 'hash', {value: 'abcdef'});
            sandbox.stub(resource.meta, 'update');

            return resource.updateHash()
                .then(() => {
                    expect(resource.meta.update).to.be.calledWith({hash: 'abcdef'});
                });
        });
    });

    function createResource_(opts) {
        opts = _.defaults(opts || {}, {
            path: '.',
            article: new Article('foo', createDummyConfig(), new Document('path', createDummyConfig()))
        });

        return new Resource(opts.path, createDummyConfig(), opts.article);
    }
});
