const ArticleUploader = require('../../../lib/zendesk-uploader/article-uploader');
const logger = require('../../../lib/logger');
const testUtils = require('./test-utils');

describe('ArticleUploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.articles = {
            create: sandbox.stub().resolves({id: 123456, position: 2}),
            update: sandbox.stub().resolves()
        };
        this.zendeskClient.translations = {
            updateForArticle: sandbox.stub().resolves({id: 54321})
        };
        this.zendeskClient.articleattachments = {
            create: sandbox.stub().resolves({id: 54321})
        };

        sandbox.stub(logger, 'info');
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('create', () => {
        it('should create an article if it doesnt exist', () => {
            const article = testUtils.createArticle({isNew: true});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.have.been.called;
                });
        });

        it('should log create article action if article is new', () => {
            const article = testUtils.createArticle({isNew: true, path: 'article/path'});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(logger.info)
                        .to.have.been.calledWith('Creating article on ZenDesk: article/path');
                });
        });

        it('should not create an article if it already exists on Zendesk', () => {
            const article = testUtils.createArticle({isNew: false});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.articles.create)
                        .to.not.have.been.called;
                });
        });

        it('should not log create article action if article is not new', () => {
            const article = testUtils.createArticle({isNew: false});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(logger.info)
                        .to.have.been.not.called;
                });
        });

        it('should reject the promise with an error when the api returns an error', () => {
            const article = testUtils.createArticle({isNew: true});
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
                isNew: true,
                meta: {locale: 'test-locale'}
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

        it('should update the articles zendeskId meta property', () => {
            const article = testUtils.createArticle({isNew: true});
            this.zendeskClient.articles.create.resolves({id: 123456, position: 42});
            const uploader = new ArticleUploader(article, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.update)
                        .to.have.been.calledWith({zendeskId: 123456});
                });
        });

        it('should write the metadata after it has been updated', () => {
            const article = testUtils.createArticle({isNew: true});
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
                const article = testUtils.createArticle({
                    isChanged: true,
                    meta: {zendeskId: 123456}
                });
                article.resources = [
                    testUtils.createResource({isNew: true})
                ];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(this.zendeskClient.articleattachments.create)
                            .to.have.been.calledWithMatch(123456);
                    });
            });

            it('should pass the resource path when uploading', () => {
                const article = testUtils.createArticle({
                    isChanged: true
                });
                article.resources = [
                    testUtils.createResource({
                        isNew: true,
                        path: './test/test1.jpg'
                    })
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
                    testUtils.createResource({
                        isChanged: false,
                        isNew: true
                    }),
                    testUtils.createResource({
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

            it('should log create action for each created resource', () => {
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
                        expect(logger.info)
                            .to.have.been.calledWith('Creating resource on ZenDesk: test.jpg')
                            .and.to.have.been.calledWith('Creating resource on ZenDesk: test2.jpg');
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
                const article = testUtils.createArticle({isChanged: true});
                const resource = testUtils.createResource({isNew: true});
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
                const article = testUtils.createArticle({
                    isChanged: true
                });
                article.resources = [
                    testUtils.createResource({isNew: true}),
                    testUtils.createResource({isNew: true})
                ];
                this.zendeskClient.articleattachments.create.onSecondCall().rejects({error: 'error'});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return expect(uploader.create())
                    .to.be.rejectedWith({error: 'error'});
            });

            it('should write the article metadata after all resources were uploaded', () => {
                const article = testUtils.createArticle({isChanged: true});
                const resource = testUtils.createResource({isNew: true});
                article.resources = [resource];
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.create()
                    .then(() => {
                        expect(article.meta.write)
                            .to.have.been.calledOnce;
                    });
            });
        });
    });

    describe('sync', () => {
        describe('article update', () => {
            it('should update the article if it has changed', () => {
                const article = testUtils.createArticle({isChanged: true});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.articles.update)
                            .to.have.been.called;
                    });
            });

            it('should log article update action if article changed', () => {
                const article = testUtils.createArticle({isChanged: true, path: 'article/path'});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(logger.info)
                            .to.have.been.calledWith('Synchronizing article on ZenDesk: article/path');
                    });
            });

            it('should update the article for the correct zendeskId', () => {
                const article = testUtils.createArticle({
                    isChanged: true,
                    meta: {zendeskId: 12345}
                });
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.articles.update)
                            .to.have.been.calledWithMatch(12345);
                    });
            });

            it('should not update the article if it has not changed', () => {
                const article = testUtils.createArticle({isChanged: false});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.articles.update)
                            .to.not.have.been.called;
                    });
            });

            it('should not log article update action if article was not changed', () => {
                const article = testUtils.createArticle({isChanged: false});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(logger.info)
                            .to.have.been.not.called;
                    });
            });

            it('should reject the promise when the article update API returns an error', () => {
                const section = testUtils.createArticle({isChanged: true});
                const error = {error: 'error message'};
                const uploader = new ArticleUploader(section, this.zendeskClient);

                this.zendeskClient.articles.update.rejects(error);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });

            it('should set the article `position` to the request if one is provided', () => {
                const article = testUtils.createArticle({
                    isChanged: true,
                    meta: {position: 42}
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
                    isChanged: true,
                    meta: {labels: ['test1', 'test2']}
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

            it('should set the section id to the request', () => {
                const section = testUtils.createSection({
                    meta: {zendeskId: 123456}
                });
                const article = testUtils.createArticle({
                    isChanged: true,
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

        describe('translations update', () => {
            it('should update the article translation if the article has changed', () => {
                const article = testUtils.createArticle({isChanged: true});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForArticle)
                            .to.have.been.called;
                    });
            });

            it('should update the article translation for the correct zendeskId', () => {
                const article = testUtils.createArticle({
                    isChanged: true,
                    meta: {zendeskId: 12345}
                });
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForArticle)
                            .to.have.been.calledWithMatch(12345);
                    });
            });

            it('should not update the article translation if article has not changed', () => {
                const article = testUtils.createArticle({isChanged: false});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForArticle)
                            .to.not.have.been.called;
                    });
            });


            it('should reject the promise when the translations API returns an error', () => {
                const section = testUtils.createArticle({isChanged: true});
                const error = {error: 'error message'};
                const uploader = new ArticleUploader(section, this.zendeskClient);

                this.zendeskClient.translations.updateForArticle.rejects(error);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });

            it('should update the translation for the correct locale', () => {
                const article = testUtils.createArticle({
                    isChanged: true,
                    meta: {locale: 'test-locale'}
                });
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForArticle)
                            .to.have.been.calledWithMatch(sinon.match.any, 'test-locale');
                    });
            });

            it('should set the locale to the request', () => {
                const article = testUtils.createArticle({
                    isChanged: true,
                    meta: {locale: 'test-locale'}
                });
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForArticle)
                            .to.have.been.calledWith(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    'locale': 'test-locale'
                                })
                            });
                    });
            });

            it('should set the html to the request', () => {
                const article = testUtils.createArticle({
                    isChanged: true,
                    convertMarkdown: sinon.stub().resolves('<p>Lorem ipsum dolor sit amet</p>')
                });
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForArticle)
                            .to.have.been.calledWith(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    'body': '<p>Lorem ipsum dolor sit amet</p>'
                                })
                            });
                    });
            });

            it('should set the title to the request', () => {
                const article = testUtils.createArticle({
                    isChanged: true,
                    meta: {title: 'Test Title'}
                });
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForArticle)
                            .to.have.been.calledWith(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    title: 'Test Title'
                                })
                            });
                    });
            });
        });

        describe('hash', () => {
            it('should update article hash after updating article if article was changed', () => {
                const article = testUtils.createArticle({isChanged: true});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(article.updateHash).to.be.calledOnce;
                    });
            });

            it('should reject if failed to update article hash', () => {
                const article = testUtils.createArticle({isChanged: true});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                article.updateHash.rejects('Error');

                return expect(uploader.sync())
                    .to.be.rejectedWith('Error');
            });


            it('should not update article hash if article has not been changed', () => {
                const article = testUtils.createCategory({isChanged: false});
                const uploader = new ArticleUploader(article, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(article.updateHash).to.be.not.called;
                    });
            });
        });
    });
});
