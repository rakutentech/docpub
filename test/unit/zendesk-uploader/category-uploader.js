const CategoryUploader = require('../../../lib/zendesk-uploader/category-uploader');
const SectionUploader = require('../../../lib/zendesk-uploader/section-uploader');
const testUtils = require('./test-utils');

describe('CategoryUploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.categories = {
            create: sandbox.stub().yields(null, null, {id: 123456, position: 2})
        };
        this.createSectionStub = sandbox.stub(SectionUploader.prototype, 'upload').returns(Promise.resolve());
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('upload', () => {
        it('should create a category', () => {
            const category = testUtils.createCategory();
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create)
                        .to.have.been.called;
                });
        });

        it('should reject with an error if title is not defined', () => {
            const category = testUtils.createCategory();
            delete category.meta.title;
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(/title/);
        });

        it('should reject the promise when the create category API returns an error', () => {
            const category = testUtils.createCategory();
            let error = {
                error: 'error message'
            };
            this.zendeskClient.categories.create.yields(error);
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const category = testUtils.createCategory({
                meta: {
                    locale: 'test-locale'
                }
            });
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create)
                        .to.have.been.calledWith({
                            category: sinon.match({
                                locale: 'test-locale'
                            })
                        });
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            process.env.ZENDESK_API_LOCALE = 'env-locale';
            const category = testUtils.createCategory();
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create)
                        .to.have.been.calledWith({
                            category: sinon.match({
                                locale: 'env-locale'
                            })
                        });
                    delete process.env.ZENDESK_API_LOCALE;
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            const category = testUtils.createCategory();
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create)
                        .to.have.been.calledWith({
                            category: sinon.match({
                                locale: 'en-us'
                            })
                        });
                });
        });

        it('should set the category `position` to the request if one is provided', () => {
            const category = testUtils.createCategory({
                meta: {
                    position: 42
                }
            });
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create)
                        .to.have.been.calledWith({
                            category: sinon.match({
                                position: 42
                            })
                        });
                });
        });

        it('should set the category description to the request if one is provided', () => {
            const category = testUtils.createCategory({
                meta: {
                    description: 'Description goes here'
                }
            });
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.categories.create)
                        .to.have.been.calledWith({
                            category: sinon.match({
                                description: 'Description goes here'
                            })
                        });
                });
        });

        it('should return the updated category metadata on success', () => {
            const category = testUtils.createCategory({
                meta: {
                    title: 'Category Title',
                    locale: 'locale',
                    description: 'description'
                }
            });
            this.zendeskClient.categories.create.yields(null, null, {id: 123456, position: 42});
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return expect(uploader.upload())
                .to.have.become({
                    title: 'Category Title',
                    id: 123456,
                    locale: 'locale',
                    position: 42,
                    description: 'description'
                });
        });

        it('should set the returned category id to the meta property', () => {
            const category = testUtils.createCategory();
            const uploader = new CategoryUploader(category, this.zendeskClient);
            this.zendeskClient.categories.create.yields(null, null, {id: 98765});

            return uploader.upload()
                .then(() => {
                    expect(category.meta.id)
                        .to.be.eql(98765);
                });
        });

        it('should set the returned category position to the meta property', () => {
            const category = testUtils.createCategory();
            this.zendeskClient.categories.create.yields(null, null, {id: 123456, position: 42});
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(category.meta.position)
                        .to.be.eql(42);
                });
        });

        it('should upload each section passed in the `sections` array', () => {
            const category = testUtils.createCategory();
            category.sections = [
                testUtils.createSection({category: category}),
                testUtils.createSection({category: category})
            ];
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.createSectionStub)
                        .to.have.been.calledTwice;
                });
        });

        it('should not upload any sections if no sections were provided', () => {
            const category = testUtils.createCategory({sections: []});
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.createSectionStub)
                        .to.not.have.been.called;
                });
        });

        it('should reject with an error if a section upload returns an error', () => {
            const category = testUtils.createCategory();
            const error = {error: 'error'};
            this.createSectionStub.yields(error);
            const uploader = new CategoryUploader(category, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(error);
        });
    });
});
