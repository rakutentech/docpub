const SectionUploader = require('../../../lib/zendesk-uploader/section-uploader');
const ArticleUploader = require('../../../lib/zendesk-uploader/article-uploader');
const testUtils = require('./test-utils');

describe('SectionUploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.sections = {
            create: sandbox.stub().yields(null, null, {id: 123456, position: 2})
        };
        this.createArticleStub = sandbox.stub(ArticleUploader.prototype, 'upload').returns(Promise.resolve());
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('upload', () => {
        it('should reject with an error if title is not defined', () => {
            const section = testUtils.createSection();
            delete section.meta.title;
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(/title/);
        });

        it('should reject with an error if category id is not defined', () => {
            const section = testUtils.createSection();
            delete section.category.meta.id;
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(/id/);
        });

        it('should reject the promise when the create sections API returns an error', () => {
            let error = {
                error: 'error message'
            };
            this.zendeskClient.sections.create.yields(error);
            const uploader = new SectionUploader(testUtils.createSection(), this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const section = testUtils.createSection({
                meta: {
                    locale: 'test-locale'
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                locale: 'test-locale'
                            })
                        });
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            const section = testUtils.createSection();
            delete section.meta.locale;
            process.env.ZENDESK_API_LOCALE = 'env-locale';
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                locale: 'env-locale'
                            })
                        });
                    delete process.env.ZENDESK_API_LOCALE;
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            const section = testUtils.createSection();
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                locale: 'en-us'
                            })
                        });
                });
        });

        it('should set the section `position` to the request if one is provided', () => {
            const section = testUtils.createSection({
                meta: {
                    position: 42
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                position: 42
                            })
                        });
                });
        });

        it('should set the section description to the request if one is provided', () => {
            const section = testUtils.createSection({
                meta: {
                    description: 'Section description goes here'
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                description: 'Section description goes here'
                            })
                        });
                });
        });

        it('should return the updated section metadata on success', () => {
            const section = testUtils.createSection({
                meta: {
                    title: 'Section Title',
                    locale: 'locale',
                    description: 'description'
                }
            });
            this.zendeskClient.sections.create.yields(null, null, {id: 123456, position: 42});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.upload()).to.eventually.become({
                title: 'Section Title',
                id: 123456,
                position: 42,
                locale: 'locale',
                description: 'description'
            });
        });

        it('should set the returned section id to the meta property', () => {
            const section = testUtils.createSection();
            this.zendeskClient.sections.create.yields(null, null, {id: 123456, position: 42});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then((meta) => {
                    expect(meta.id)
                        .to.be.eql(123456);
                });
        });

        it('should set the returned section position to the meta property', () => {
            const section = testUtils.createSection();
            this.zendeskClient.sections.create.yields(null, null, {id: 123456, position: 454});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then((meta) => {
                    expect(meta.position)
                        .to.be.eql(454);
                });
        });

        it('should upload each article passed in the `articles` array', () => {
            const section = testUtils.createSection();
            section.sections = [
                testUtils.createArticle({section: section}),
                testUtils.createArticle({section: section})
            ];
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.createArticleStub)
                        .to.have.been.calledTwice;
                });
        });

        it('should not upload any articles if no articles were provided', () => {
            const section = testUtils.createSection({
                articles: []
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.createArticleStub)
                        .to.not.have.been.called;
                });
        });

        it('should reject with an error if an article upload returns an error', () => {
            const section = testUtils.createSection();
            const error = {error: 'error'};
            this.createArticleStub.yields(error);
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(error);
        });
    });
});

