const proxyquire = require('proxyquire');
const path = require('path');
let ZendeskPipeline;
let Category;

describe('ZendeskPipeline', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
        Category = sandbox.stub();
        ZendeskPipeline = proxyquire('../../lib/zendesk-pipeline', {
            './category': Category
        });

        sandbox.stub(Category.prototype, 'read').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should not throw if opts were not passed', () => {
            expect(() => new ZendeskPipeline()).to.not.throw;
        });

        it('should use path passed in params if it was passed', () => {
            const pipeline = new ZendeskPipeline({path: 'foo'});

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category)
                        .to.be.calledWithMatch(/\/foo$/);
                });
        });

        it('should use `process.cwd()` as path to repo if it was not passed in params', () => {
            const pipeline = new ZendeskPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category)
                        .to.be.calledWith(process.cwd());
                });
        });

        it('should resolve path received in parameters', () => {
            const pipeline = new ZendeskPipeline({path: '../foo/bar'});

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category)
                        .to.be.calledWith(path.resolve(process.cwd(), '../foo/bar'));
                });
        });
    });

    describe('uploadCategory', () => {
        it('should read project directory', () => {
            const pipeline = new ZendeskPipeline();

            return pipeline.uploadCategory()
                .then(() => {
                    expect(Category.prototype.read).to.be.calledOnce;
                });
        });

        it('should reject if failed to read project directory', () => {
            Category.prototype.read.rejects(new Error('error'));

            const pipeline = new ZendeskPipeline();

            return expect(pipeline.uploadCategory())
                .to.be.rejectedWith(/error/);
        });
    });
});
