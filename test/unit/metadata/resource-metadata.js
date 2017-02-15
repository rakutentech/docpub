const path = require('path');

const Metadata = require('../../../lib/metadata/metadata');
const Dictionary = require('../../../lib/metadata/parser/dictionary');
const Property = require('../../../lib/metadata/parser/property');
const ResourceMetadata = require('../../../lib/metadata/resource-metadata');

describe('ResourceMetadata', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        sandbox.stub(Metadata.prototype, 'read').resolves();
        sandbox.stub(Metadata.prototype, 'write').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if path is not a string', () => {
            expect(() => new ResourceMetadata({}))
                .to.throw(/string/);
        });

        it('should throw if path is empty', () => {
            expect(() => new ResourceMetadata(''))
                .to.throw(/empty/);
        });

        it('should throw if `articleMetadata` is not instance of `Metadata`', () => {
            expect(() => new ResourceMetadata('foo', {}))
                .to.throw(/Metadata/);
        });
    });

    describe('read', () => {
        it('should populate properties from article resource section on self', () => {
            const meta = createResourceMeta_('file.foo', {
                zendeskId: 123,
                hash: 'abcdef'
            });

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('zendeskId', 123);
                    expect(meta).to.have.property('hash', 'abcdef');
                });
        });

        it('should read resource meta from article meta by basename of resource path', () => {
            const articleMeta = new Metadata(
                'article_path',
                Dictionary.createRoot(sinon.createStubInstance(Dictionary)),
                Dictionary.createRoot(sinon.createStubInstance(Dictionary))
            );

            articleMeta.resources = {
                'file.foo': {zendeskId: 123456}
            };

            const resourceMeta = new ResourceMetadata('some/long/resource/path/file.foo', articleMeta);

            return resourceMeta.read()
                .then(() => {
                    expect(resourceMeta.zendeskId).to.be.equal(123456);
                });
        });

        it('should make `zendeskId` equal 0 by default', () => {
            const meta = createResourceMeta_('file.foo', {
                hash: 'abcdef'
            });

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('zendeskId', 0);
                });
        });

        it('should make hash equal empty string by default', () => {
            const meta = createResourceMeta_('file.foo', {zendeskId: 123});

            return meta.read()
                .then(() => {
                    expect(meta).to.have.property('hash', '');
                });
        });
    });

    describe('update', () => {
        it('should update `zendeskId` and `hash` properties from update data', () => {
            const meta = createResourceMeta_();

            meta.update({
                zendeskId: 123,
                hash: 'abcdef'
            });

            expect(meta).to.have.property('zendeskId', 123);
            expect(meta).to.have.property('hash', 'abcdef');
        });

        it('should not pick another data except `zendeskId` and `hash`', () => {
            const meta = createResourceMeta_();

            meta.update({
                foo: 'bar'
            });

            expect(meta).to.not.have.property('foo');
        });

        it('should push the update to article meta by resource name', () => {
            const articleMeta = createArticleMeta_('some_path');
            const resourceMeta = new ResourceMetadata('path/to/resource/resource.name', articleMeta);

            resourceMeta.update({
                zendeskId: 456,
                hash: 'zyxwuv'
            });

            expect(articleMeta.resources['resource.name'])
                .to.be.eql({
                    zendeskId: 456,
                    hash: 'zyxwuv'
                });
        });

        it('should not modify information about other resources in the article', () => {
            const articleMeta = createArticleMeta_('resource_path');
            articleMeta.resources = {
                'resource': {
                    zendeskId: 1,
                    hash: 'a'
                },
                'another_resource': {
                    zendeskId: 2,
                    hash: 'b'
                }
            };

            const meta = new ResourceMetadata('resource', articleMeta);

            meta.update({
                zendeskId: 3,
                hash: 'c'
            });

            expect(articleMeta.resources.another_resource)
                .to.be.eql({
                    zendeskId: 2,
                    hash: 'b'
                });
        });
    });

    describe('write', () => {
        it('should push data to the the article meta', () => {
            const meta = createResourceMeta_();

            sandbox.spy(meta, 'update');

            return meta.write()
                .then(() => expect(meta.update).to.be.calledOnce);
        });

        it('should write article meta to disc', () => {
            const articleMeta = createArticleMeta_('resource_path');
            const meta = new ResourceMetadata('resource_path', articleMeta);

            return meta.write()
                .then(() => expect(articleMeta.write).to.be.calledOnce);
        });

        it('should reject if failed to write article meta', () => {
            const articleMeta = createArticleMeta_('resource_path');
            const meta = new ResourceMetadata('resource_path', articleMeta);

            articleMeta.write.rejects('Failure');

            return expect(meta.write())
                .to.be.rejectedWith('Failure');
        });
    });
});

function createResourceMeta_(resourcePath, rawMeta) {
    resourcePath = resourcePath || 'default.resource';

    const articleMeta = createArticleMeta_(resourcePath, rawMeta);

    return new ResourceMetadata(resourcePath, articleMeta);
}

function createArticleMeta_(resourcePath, rawMeta) {
    const articleMeta = new Metadata(
        'article_path',
        Dictionary.createRoot(sinon.createStubInstance(Dictionary)),
        Dictionary.createRoot(new Property('resources'))
    );

    articleMeta.resources = {
        [path.basename(resourcePath)]: rawMeta
    };

    return articleMeta;
}
