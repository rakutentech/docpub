const ArticleUploader = require('../../../lib/zendesk-uploader/article-uploader');
const testUtils = require('./test-utils');

describe('ArticleUploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.articles = {
            create: sandbox.stub().resolves({id: 123456, position: 2}),
            update: sandbox.stub().resolves()
        };
        this.zendeskClient.articleattachments = {
            create: sandbox.stub().resolves({id: 54321})
        };
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('create', () => {
        it('should create an article if it doesnt exist', () => {
            const article = testUtils.createArticle();
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.called;
                });
        });

        it('should not create an article if it already exists on Zendesk (has zendeskId)', () => {
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 1234
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.not.have.been.called;
                });
        });

        it('should reject the promise with an error when the api returns an error', () => {
            const article = testUtils.createArticle();
            const error = {
                error: 'error message'
            };
            this.zendeskClient.articles.create.rejects(error);
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return expect(uploader.create())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const article = testUtils.createArticle({
                meta: {
                    locale: 'test-locale'
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
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

            return uploader.create()
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

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                locale: 'en-us'
                            })
                        });
                });
        });

        it('should update the articles zendeskId meta property', () => {
            const article = testUtils.createArticle();
            this.zendeskClient.articles.create.resolves({id: 123456, position: 42});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.update)
                        .to.have.been.calledWith({zendeskId: 123456});
                });
        });

        it('should write the metadata after it has been updated', () => {
            const article = testUtils.createArticle();
            this.zendeskClient.articles.create.resolves({id: 123456, position: 42});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.write)
                        .to.have.been.calledAfter(uploader.meta.update);
                });
        });

        describe('resources', () => {
            it('should upload resources to the correct zendeskId', () => {
                const article = testUtils.createArticle({meta: {zendeskId: 123456}});
                article.resources = [
                    testUtils.createResource()
                ];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(this.zendeskClient.articleattachments.create)
                            .to.have.been.calledWithMatch(123456);
                    });
            });

            it('should pass the resource path when uploading', () => {
                const article = testUtils.createArticle({meta: {zendeskId: 123456}});
                article.resources = [
                    testUtils.createResource({path: './test/test1.jpg'})
                ];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(this.zendeskClient.articleattachments.create)
                            .to.have.been.calledWithMatch(sinon.match.any, './test/test1.jpg');
                    });
            });

            it('should upload all new resources', () => {
                const article = testUtils.createArticle();
                article.resources = [
                    testUtils.createResource({isNew: true}),
                    testUtils.createResource({isNew: true})
                ];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(this.zendeskClient.articleattachments.create)
                            .to.have.been.calledTwice;
                    });
            });

            it('should upload all changed resources', () => {
                const article = testUtils.createArticle();
                article.resources = [
                    testUtils.createResource({
                        isChanged: true,
                        isNew: false
                    }),
                    testUtils.createResource({
                        isChanged: true,
                        isNew: false
                    })
                ];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(this.zendeskClient.articleattachments.create)
                            .to.have.been.calledTwice;
                    });
            });

            it('should upload both new and changed resources at the same time', () => {
                const article = testUtils.createArticle();
                article.resources = [
                    testUtils.createResource({
                        path: 'test.jpg',
                        isChanged: true,
                        isNew: false
                    }),
                    testUtils.createResource({
                        path: 'test2.jpg',
                        isChanged: false,
                        isNew: true
                    })
                ];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(this.zendeskClient.articleattachments.create)
                            .to.have.been.calledTwice;
                    });
            });

            it('should not upload any resources if none are changed or new', () => {
                const article = testUtils.createArticle();
                article.meta.resources = [
                    testUtils.createResource({
                        path: 'test.jpg',
                        isChanged: false,
                        isNew: false
                    }),
                    testUtils.createResource({
                        path: 'test2.jpg',
                        isChanged: false,
                        isNew: false
                    })
                ];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(this.zendeskClient.articleattachments.create)
                            .to.not.have.been.called;
                    });
            });

            it('should update the zendeskId after successful upload', () => {
                const article = testUtils.createArticle();
                const resource = testUtils.createResource();
                article.resources = [
                    resource
                ];
                this.zendeskClient.articleattachments.create.resolves({id: 54321});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(resource.meta.update)
                            .to.have.been.calledWith({zendeskId: 54321});
                    });
            });

            it('should reject the promise if one of the uploads fails', () => {
                const article = testUtils.createArticle({meta: {zendeskId: 123456}});
                article.resources = [
                    testUtils.createResource(),
                    testUtils.createResource()
                ];
                this.zendeskClient.articleattachments.create.onSecondCall().rejects({error: 'error'});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return expect(uploader.create())
                    .to.be.rejectedWith({error: 'error'});
            });

            it('should write the resource metadata if resources were created', () => {
                const article = testUtils.createArticle({meta: {zendeskId: 123456}});
                const resource = testUtils.createResource();
                article.resources = [resource];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(resource.meta.write)
                            .to.have.been.called;
                    });
            });

            it('should not write the resource metadata if resources were not created', () => {
                const article = testUtils.createArticle({meta: {zendeskId: 123456}});
                const resource = testUtils.createResource();
                article.resources = [];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(resource.meta.write)
                            .to.not.have.been.called;
                    });
            });
        });
    });

    describe('sync', () => {
        it('should update the article if it has changed', () => {
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 1234
                },
                isChanged: sinon.stub().resolves(true)
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.have.been.called;
                });
        });

        it('should not update the article if it has not changed', () => {
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 1234
                },
                isChanged: sinon.stub().resolves(false)
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.not.have.been.called;
                });
        });

        it('should reject the promise when the update article API returns an error', () => {
            const section = testUtils.createArticle();
            const error = {
                error: 'error message'
            };
            this.zendeskClient.articles.update.rejects(error);
            const uploader = new ArticleUploader(section, this.zendeskClient);

            return expect(uploader.sync())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 1234,
                    locale: 'test-locale'
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                locale: 'test-locale'
                            })
                        });
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            process.env.ZENDESK_API_LOCALE = 'env-locale';
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 12345
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                locale: 'env-locale'
                            })
                        });
                    delete process.env.ZENDESK_API_LOCALE;
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 12345
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                locale: 'en-us'
                            })
                        });
                });
        });

        it('should set the article `position` to the request if one is provided', () => {
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 12345,
                    position: 42
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
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
                    zendeskId: 1234,
                    labels: ['test1', 'test2']
                }
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                'label_names': ['test1', 'test2']
                            })
                        });
                });
        });

        it('should set the html to the request', () => {
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 1234
                },
                convertMarkdown: sinon.stub().resolves('<p>Lorem ipsum dolor sit amet</p>')
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                'body': '<p>Lorem ipsum dolor sit amet</p>'
                            })
                        });
                });
        });

        it('should set the section id to the request', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 123456
                }
            });
            const article = testUtils.createArticle({
                meta: {
                    zendeskId: 1234
                },
                section: section
            });
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.articles.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            article: sinon.match({
                                'section_id': 123456
                            })
                        });
                });
        });
    });
});
