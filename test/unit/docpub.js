const proxyquire = require('proxyquire');
const path = require('path');
const logger = require('../../lib/logger');
let DocpubPipeline;
let Category;
let CategoryUploader;
let ZendeskDeleter;

describe('DocpubPipeline', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        Category = sandbox.stub();
        CategoryUploader = sandbox.stub();
        ZendeskDeleter = sandbox.stub();
        DocpubPipeline = proxyquire('../../lib/docpub', {
            './logger': logger,
            './category': Category,
            './zendesk-uploader/category-uploader': CategoryUploader,
            './zendesk-uploader/deleter': ZendeskDeleter
        });

        sandbox.stub(Category.prototype, 'read').resolves();
        sandbox.stub(CategoryUploader.prototype, 'upload').resolves();
        sandbox.stub(ZendeskDeleter.prototype, 'delete').resolves();

        sandbox.stub(logger);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should not throw if opts were not passed', () => {
            expect(() => new DocpubPipeline()).to.not.throw;
        });

        it('should use path passed in params if it was passed', () => {
            const pipeline = new DocpubPipeline({path: 'foo'});

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category)
                        .to.be.calledWithMatch(/\/foo$/);
                });
        });

        it('should use `process.cwd()` as path to repo if it was not passed in params', () => {
            const pipeline = new DocpubPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category)
                        .to.be.calledWith(process.cwd());
                });
        });

        it('should resolve path received in parameters', () => {
            const pipeline = new DocpubPipeline({path: '../foo/bar'});

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category)
                        .to.be.calledWith(path.resolve(process.cwd(), '../foo/bar'));
                });
        });

        it('should setup logger', () => {
            /*eslint-disable no-new*/
            new DocpubPipeline({verbose: true});
            /*eslint-enable no-new*/

            expect(logger.setup).to.be.calledWithMatch({verbose: true});
        });
    });

    describe('uploadCategory', () => {
        before(() => {
            process.env.ZENDESK_API_USERNAME = 'username';
            process.env.ZENDESK_API_TOKEN = 'token';
            process.env.ZENDESK_URL = 'url';
        });

        after(() => {
            delete process.env.ZENDESK_API_USERNAME;
            delete process.env.ZENDESK_API_TOKEN;
            delete process.env.ZENDESK_URL;
        });

        it('should log upload process start', () => {
            const pipeline = new DocpubPipeline({path: 'category/path'});

            return pipeline.uploadCategory()
                .then(() => {
                    expect(logger.info)
                        .to.be.calledWith('Start uploading.');
                });
        });

        it('should read project directory', () => {
            const pipeline = new DocpubPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category.prototype.read).to.be.calledOnce;
                });
        });

        it('should reject if failed to read project directory', () => {
            Category.prototype.read.rejects(new Error('error'));

            const pipeline = new DocpubPipeline();

            return expect(pipeline.uploadCategory())
                .to.be.rejectedWith(/error/);
        });

        it('should upload category', () => {
            const pipeline = new DocpubPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(CategoryUploader.prototype.upload)
                        .to.be.calledOnce;
                });
        });

        it('should pass category for uploading to CategoryUploader', () => {
            Category.returns(Category);

            const pipeline = new DocpubPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(CategoryUploader).to.be.calledWithMatch(Category);
                });
        });

        it('should log uploading success if all was uploaded correctly', () => {
            const pipeline = new DocpubPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(logger.info)
                        .to.be.calledWithMatch(`Successfully uploaded all entities for category`);
                });
        });

        it('should reject if category uploading failed with error', () => {
            CategoryUploader.prototype.upload.rejects(new Error('error'));

            const pipeline = new DocpubPipeline();

            return expect(pipeline.uploadCategory())
                .to.be.rejectedWith(/error/);
        });

        it('should log error if category uploading finished with error', () => {
            CategoryUploader.prototype.upload.rejects(new Error('error'));

            const pipeline = new DocpubPipeline();

            return expect(pipeline.uploadCategory()).to.be.rejectedWith()
                .then(() => {
                    expect(logger.error).to.be.calledWith(`Upload failed!`);
                });
        });

        it('should delete documents on zendesk that dont exist locally', () => {
            const pipeline = new DocpubPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(ZendeskDeleter.prototype.delete)
                        .to.be.calledOnce;
                });
        });

        it('should call delete after upload', () => {
            const pipeline = new DocpubPipeline();

            CategoryUploader.prototype.upload.returns(
                new Promise(resolve => {
                    expect(ZendeskDeleter.prototype.delete)
                        .to.not.have.been.called;
                    resolve();
                })
            );

            return pipeline.uploadCategory()
                .then(() => {
                    expect(ZendeskDeleter.prototype.delete)
                        .to.be.calledAfter(CategoryUploader.prototype.upload);
                });
        });

        it('should reject if deleter returns an error', () => {
            const pipeline = new DocpubPipeline();
            ZendeskDeleter.prototype.delete.rejects('error');

            return expect(pipeline.uploadCategory())
                .to.be.rejectedWith('error');
        });
    });
});
