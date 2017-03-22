const _ = require('lodash');
const mockFs = require('mock-fs');
const Section = require('../../lib/section');
const Article = require('../../lib/article');
const Resource = require('../../lib/resource');
const fsu = require('../../lib/fs-utils.js');
const hash = require('../../lib/hash');
const MarkdownRenderer = require('../../lib/md-renderer');
const metadata = require('../../lib/metadata');
const Metadata = require('../../lib/metadata/metadata');
const logger = require('../../lib/logger');
const createDummyConfig = require('./test-utils').createDummyConfig;

describe('Article', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        sandbox.stub(Metadata.prototype, 'read').resolves();
    });

    afterEach(() => {
        sandbox.restore();
        mockFs.restore();
    });

    describe('constructor', () => {
        it('should throw if path is not string', () => {
            const path = {};

            expect(() => new Article(path)).to.throw(/string/);
        });

        it('should throw if path empty', () => {
            const path = '';

            expect(() => new Article(path)).to.throw(/empty/);
        });

        it('should throw if parent section is not passed', () => {
            expect(() => new Article('.', createDummyConfig())).to.throw(/Missing section/);
        });

        it('should set article path as passed path', () => {
            const article = createArticle_({path: 'foo'});

            expect(article.path).to.be.eql('foo');
        });

        it('should set parent section as passed section', () => {
            const section = sinon.createStubInstance(Section);
            const article = createArticle_({section: section});

            expect(article.section).to.be.equal(section);
        });

        it('should set article type as `article`', () => {
            const article = createArticle_();

            expect(article.type).to.be.eql('article');
        });

        it('should initialise metadata', () => {
            const article = createArticle_();

            expect(article.meta).to.be.instanceOf(Metadata);
        });

        it('should initialise metadata for specified article', () => {
            sandbox.spy(metadata, 'buildForArticle');

            createArticle_({path: 'some_path'});

            expect(metadata.buildForArticle).to.be.calledWith('some_path');
        });
    });

    // Sinon < 2.0.0 does not support stubbing getters, so we have to redefine properties in order to mock behavior
    describe('isChanged', () => {
        it('should return true if article hash differes from article userMetaHash', () => {
            const article = createArticle_();

            Object.defineProperty(article, 'hash', {value: 'abcdef'});
            article.meta = {hash: `0a1b2c`};

            expect(article.isChanged).to.be.true;
        });

        it('should return false if article has same hash and userMetaHash and article has no child resources', () => {
            const article = createArticle_();

            Object.defineProperty(article, 'hash', {value: 'abcdef'});
            article.meta = {hash: `abcdef`};

            article.setChildren([]);

            expect(article.isChanged).to.be.false;
        });

        it('should return true if article has same hash and currentHash but one of child resources changed', () => {
            const article = createArticle_();
            const resource = new Resource('path', createDummyConfig(), article);

            article.meta = {hash: `abcdef`};
            Object.defineProperty(article, 'hash', {value: 'abcdef'});

            Object.defineProperty(resource, 'isChanged', {value: true});

            article.setChildren([resource]);

            expect(article.isChanged).to.be.true;
        });

        it('should return false if document has same hash and currentHash and no child resources changed', () => {
            const article = createArticle_();
            const resource = new Resource('path', createDummyConfig(), article);

            article.meta = {hash: `abcdef`};
            Object.defineProperty(article, 'hash', {value: 'abcdef'});

            Object.defineProperty(resource, 'isChanged', {value: false});

            article.setChildren([resource]);

            expect(article.isChanged).to.be.false;
        });
    });

    describe('hash', () => {
        it('should calculate article hash as hash of user meta hash + markdown content hash + parent section id', () => {
            mockFs({
                'content.md': 'content_goes_here'
            });

            const section = sinon.createStubInstance(Section);
            section.meta = {zendeskId: 123456};

            const article = new Article('.', createDummyConfig(), section);

            const expectedHash = hash('abcdef' + hash('content_goes_here') + '123456');

            return article.read()
                .then(() => {
                    Object.defineProperty(article.meta, 'userMetaHash', {value: 'abcdef'});

                    expect(article.hash).to.be.equal(expectedHash);
                });
        });
    });

    describe('read', () => {
        beforeEach(() => {
            sandbox.stub(logger, 'info');
        });

        it('should log read article action', () => {
            mockFs({
                'content.md': `content_goes_here`
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(logger.info).to.be.calledWith(`Reading article .`);
                });
        });

        it('should load metadata from file named `meta.json`', () => {
            mockFs({
                'content.md': `content_goes_here`
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(Metadata.prototype.read).to.be.calledOnce;
                });
        });

        it('should search for .md file with article content', () => {
            mockFs({
                'content.md': `content_goes_here`
            });
            sandbox.spy(fsu, 'findFilesOfTypes').named('findFilesOfTypes');

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(fsu.findFilesOfTypes).to.be.calledWith('.', '.md');
                });
        });

        it('should reject if unable to find any .md files', () => {
            mockFs({});

            const article = createArticle_();

            return expect(article.read())
                .to.be.rejectedWith(/No markdown files/);
        });

        it('should reject if found more than 1 .md file', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'more_content.md': `content_goes_here`
            });

            const article = createArticle_();

            return expect(article.read())
                .to.be.rejectedWith(/more than 1 markdown/);
        });

        it('should reject if failed to read markdown contents', () => {
            mockFs({
                'content.md': mockFs.file({
                    mode: '0000',
                    content: 'content_goes_here'
                })
            });

            const article = createArticle_('.');

            return expect(article.read())
                .to.be.rejectedWith(/EACCES/);
        });

        it('should load article resources', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.jpg': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.have.length(1);
                });
        });

        it('should load resources as `Resource` instances', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.jpg': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources[0]).to.be.instanceOf(Resource);
                });
        });

        it('should initialise resources with correct resource paths', () => {
            mockFs({
                'path/to/article': {
                    'content.md': 'content_goes_here',
                    'image.jpg': 'image_bytes_here'
                }
            });

            const article = createArticle_({path: 'path/to/article'});

            return article.read()
                .then(() => {
                    expect(article.resources[0].path)
                        .to.be.equal('path/to/article/image.jpg');
                });
        });

        it('should search for article resources in `.jpg` format', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.jpg': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.have.length(1);
                    expect(article.resources[0].path)
                        .to.include('image.jpg');
                });
        });

        it('should search for article resources in `.jpeg` format', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.jpeg': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.have.length(1);
                    expect(article.resources[0].path)
                        .to.include('image.jpeg');
                });
        });

        it('should search for article resources in `.png` format', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.png': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.have.length(1);
                    expect(article.resources[0].path)
                        .to.include('image.png');
                });
        });

        it('should search for article resources in `.gif` format', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.gif': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.have.length(1);
                    expect(article.resources[0].path)
                        .to.include('image.gif');
                });
        });

        it('should search for article resources in `.svg` format', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.svg': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.have.length(1);
                    expect(article.resources[0].path)
                        .to.include('image.svg');
                });
        });

        it('should search for article resources in `.pdf` format', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.pdf': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(article.resources).to.have.length(1);
                    expect(article.resources[0].path)
                        .to.include('image.pdf');
                });
        });

        it('should search for all available resources in same time', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.jpg': 'image_bytes_here',
                'image.jpeg': 'image_bytes_here',
                'image.png': 'image_bytes_here',
                'image.gif': 'image_bytes_here',
                'image.svg': 'image_bytes_here',
                'image.pdf': 'image_bytes_here'
            });

            const article = createArticle_();

            return article.read()
                .then(() => {
                    const paths = article.resources.map(resource => resource.path);

                    expect(paths)
                        .to.match(/image.jpg/)
                        .and.to.match(/image.jpeg/)
                        .and.to.match(/image.png/)
                        .and.to.match(/image.gif/)
                        .and.to.match(/image.svg/)
                        .and.to.match(/image.pdf/);
                });
        });

        it('should start reading of all the resources contents', () => {
            mockFs({
                'content.md': `content_goes_here`,
                'image.pdf': 'image_bytes_here',
                'image.png': 'image_bytes_here'
            });

            sandbox.stub(Resource.prototype, 'read').resolves();

            const article = createArticle_();

            return article.read()
                .then(() => {
                    expect(Resource.prototype.read).to.be.calledTwice;
                });
        });
    });

    describe('updateHash', () => {
        beforeEach(() => {
            sandbox.spy(Metadata.prototype, 'update');
            sandbox.stub(Metadata.prototype, 'write').resolves();
        });

        it('should update hash in meta with own hash', () => {
            const article = createArticle_();
            Object.defineProperty(article, 'hash', {value: 'abcdef'});

            return article.updateHash()
                .then(() => {
                    expect(article.meta.update)
                        .to.be.calledWith({hash: 'abcdef'});
                });
        });

        it('should update hashes of all its resources', () => {
            const article = createArticle_();
            Object.defineProperty(article, 'hash', {value: 'abcdef'});

            const resource = new Resource('res_name', createDummyConfig(), article);
            Object.defineProperty(resource, 'hash', {value: '123abc'});

            const anotherResource = new Resource('another_res_name', createDummyConfig(), article);
            Object.defineProperty(anotherResource, 'hash', {value: '456def'});

            article.setChildren([resource, anotherResource]);

            return article.updateHash()
                .then(() => {
                    expect(article.meta.update).to.be.calledThrice; // 1 more call for own hash update
                    expect(article.meta.resources)
                        .to.be.eql({
                            'res_name': {hash: '123abc'},
                            'another_res_name': {hash: '456def'}
                        });
                });
        });

        it('should write updated meta to the disc', () => {
            const article = createArticle_();
            Object.defineProperty(article, 'hash', {value: 'abcdef'});

            return article.updateHash()
                .then(() => {
                    expect(article.meta.write)
                        .to.be.calledOnce;
                });
        });

        it('should reject promise if write failed', () => {
            const article = createArticle_();
            const error = new Error('error');

            Object.defineProperty(article, 'hash', {value: 'abcdef'});
            article.meta.write.rejects(error);

            return expect(article.updateHash())
                .to.be.rejectedWith(error);
        });
    });

    describe('convertMarkdown', () => {
        it('should reject if article contents were not yet read', () => {
            const article = createArticle_();

            return expect(article.convertMarkdown())
                .to.be.rejectedWith(/No path to markdown/);
        });

        it('should reject if failed to read markdown file', () => {
            const unaccessibleMdFile = mockFs.file({
                content: 'Header',
                mode: 0
            });

            return expect(convertMarkdown_(unaccessibleMdFile))
                .to.be.rejectedWith(/EACCES, permission denied \'content.md\'/);
        });

        it('should reject if failed to convert markdown', () => {
            sandbox.stub(MarkdownRenderer.prototype, 'render')
                .rejects(new Error('convertion failed'));

            return convertMarkdown_()
                .catch(e => {
                    expect(e.message).to.match(/convertion failed/);
                });
        });

        it('should convert markdown to html', () => {
            return expect(convertMarkdown_('Header'))
                .to.eventually.become('<p>Header</p>\n');
        });

        it('should reuse results of previous conversion on subsequent calls', () => {
            mockFs({
                'content.md': '# Header'
            });
            sandbox.spy(MarkdownRenderer.prototype, 'render');

            const article = createArticle_();

            return article.read()
                .then(() => article.convertMarkdown())
                .then(() => article.convertMarkdown())
                .then(() => {
                    expect(MarkdownRenderer.prototype.render)
                        .to.be.calledOnce;
                });
        });

        function convertMarkdown_(markdown) {
            mockFs({
                'content.md': markdown || '# Header'
            });

            const article = createArticle_();

            return article.read()
                .then(() => article.convertMarkdown());
        }
    });
});

function createArticle_(opts, config) {
    opts = _.defaults(opts || {}, {
        path: '.',
        section: sinon.createStubInstance(Section)
    });

    return new Article(opts.path, createDummyConfig(config), opts.section);
}
