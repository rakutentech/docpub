const ArticleUploader = require('../../../lib/zendesk-uploader/article-uploader');
const testUtils = require('./test-utils');

describe('ArticleUploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.articles = {
            create: sandbox.stub().yields(null, null, {id: 123456, position: 2})
        };
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('upload', () => {
        it('should reject with an error if title is not defined', () => {
            const article = testUtils.createArticle();
            delete article.meta.title;
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(/title/);
        });

        it('should reject with an error if section id is not defined', () => {
            const article = testUtils.createArticle();
            delete article.section.meta.id;
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(/id/);
        });

        it('should upload an article and return the updated article metadata on success', () => {
            const article = testUtils.createArticle({
                meta: {
                    title: 'Article Title',
                    locale: 'locale',
                    labels: ['test', 'test2']
                }
            });
            this.zendeskClient.articles.create.yields(null, null, {id: 123456, position: 42});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return expect(uploader.upload())
                .to.eventually.become({
                    title: 'Article Title',
                    locale: 'locale',
                    labels: ['test', 'test2'],
                    id: 123456,
                    position: 42
                });
        });

        it('should reject the promise with an error when the api returns an error', () => {
            const article = testUtils.createArticle();
            const error = {
                error: 'error message'
            };
            this.zendeskClient.articles.create.yields(error);
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return expect(uploader.upload())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const article = testUtils.createArticle({
                meta: {
                    locale: 'test-locale'
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                locale: 'test-locale'
                            })
                        });
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            const article = testUtils.createArticle();
            process.env.ZENDESK_API_LOCALE = 'env-locale';
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                locale: 'env-locale'
                            })
                        });
                    delete process.env.ZENDESK_API_LOCALE;
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            const article = testUtils.createArticle();
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                locale: 'en-us'
                            })
                        });
                });
        });

        it('should set the `position` to the request if one is provided', () => {
            const article = testUtils.createArticle({
                meta: {
                    position: 42
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                position: 42
                            })
                        });
                });
        });

        it('should set `label_names` to the request property if labels are provided', () => {
            const article = testUtils.createArticle({
                meta: {
                    labels: ['test1', 'test2']
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                'label_names': ['test1', 'test2']
                            })
                        });
                });
        });

        it('should convert a string of comma seperated labels to an array', () => {
            const article = testUtils.createArticle({
                meta: {
                    labels: 'label1, label2, label3'
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                'label_names': ['label1', 'label2', 'label3']
                            })
                        });
                });
        });

        it('should set the `html` request property to the converted html', () => {
            const html = '<h1>Test Text Goes Here</h1>';
            const article = testUtils.createArticle({
                convertMarkdown: sandbox.stub().returns(Promise.resolve(html))
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                body: html
                            })
                        });
                });
        });

        it('should set the returned article id to the meta property', () => {
            const article = testUtils.createArticle();
            this.zendeskClient.articles.create.yields(null, null, {id: 123456, position: 42});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then((meta) => {
                    expect(meta.id)
                        .to.be.eql(123456);
                });
        });

        it('should set the returned article position to the meta property', () => {
            const article = testUtils.createArticle();
            this.zendeskClient.articles.create.yields(null, null, {id: 123456, position: 454});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.upload()
                .then((meta) => {
                    expect(meta.position)
                        .to.be.eql(454);
                });
        });
    });
});
