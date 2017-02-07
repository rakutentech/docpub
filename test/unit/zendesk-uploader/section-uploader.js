const SectionUploader = require('../../../lib/zendesk-uploader/section-uploader');
const ArticleUploader = require('../../../lib/zendesk-uploader/article-uploader');
const testUtils = require('./test-utils');

describe('SectionUploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.sections = {
            create: sandbox.stub().resolves({id: 123456, position: 2}),
            update: sandbox.stub().resolves()
        };
        this.zendeskClient.accesspolicies = {
            update: sandbox.stub().resolves()
        };
        this.createArticleStub = sandbox.stub(ArticleUploader.prototype, 'create').resolves();
        this.syncArticleStub = sandbox.stub(ArticleUploader.prototype, 'sync').resolves();
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('create', () => {
        it('should create a section if it doesnt exist', () => {
            const section = testUtils.createSection();
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.called;
                });
        });

        it('should not create the section if it already exists (has a zendesk ID)', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 123456
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.not.have.been.called;
                });
        });

        it('should reject the promise when the create sections API returns an error', () => {
            let error = {
                error: 'error message'
            };
            this.zendeskClient.sections.create.rejects(error);
            const uploader = new SectionUploader(testUtils.createSection(), this.zendeskClient);

            return expect(uploader.create())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const section = testUtils.createSection({
                meta: {
                    locale: 'test-locale'
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
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

            return uploader.create()
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

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                locale: 'en-us'
                            })
                        });
                });
        });

        it('should update the sections zendeskId meta property', () => {
            const section = testUtils.createSection();
            this.zendeskClient.sections.create.resolves({id: 123456, position: 42});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.update)
                        .to.have.been.calledWith({zendeskId: 123456});
                });
        });

        it('should write the metadata after it has been updated', () => {
            const section = testUtils.createSection();
            this.zendeskClient.sections.create.resolves({id: 123456, position: 42});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.write)
                        .to.have.been.calledAfter(uploader.meta.update);
                });
        });

        it('should create each article passed in the `articles` array', () => {
            const section = testUtils.createSection();
            section.sections = [
                testUtils.createArticle({section: section}),
                testUtils.createArticle({section: section})
            ];
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.createArticleStub)
                        .to.have.been.calledTwice;
                });
        });

        it('should not create any articles if no articles were provided', () => {
            const section = testUtils.createSection({
                articles: []
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.createArticleStub)
                        .to.not.have.been.called;
                });
        });

        it('should reject with an error if an article upload returns an error', () => {
            const section = testUtils.createSection();
            const error = {error: 'error'};
            this.createArticleStub.rejects(error);
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.create())
                .to.be.rejectedWith(error);
        });
    });

    describe('sync', () => {
        it('should update a section if it has been changed', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 12345
                },
                isChanged: sinon.stub().resolves(true)
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.sections.update)
                        .to.have.been.called;
                });
        });

        it('should not update a section if it has not been changed', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 12345
                },
                isChanged: sinon.stub().resolves(false)
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.sections.update)
                        .to.not.have.been.called;
                });
        });

        it('should reject the promise when the update section API returns an error', () => {
            const section = testUtils.createSection();
            let error = {
                error: 'error message'
            };
            this.zendeskClient.sections.update.rejects(error);
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.sync())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 1234,
                    locale: 'test-locale'
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.sections.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                locale: 'test-locale'
                            })
                        });
                });
        });

        it('should set the `locale` environment variable to the request if one was not provided', () => {
            process.env.ZENDESK_API_LOCALE = 'env-locale';
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 12345
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.sections.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                locale: 'env-locale'
                            })
                        });
                    delete process.env.ZENDESK_API_LOCALE;
                });
        });

        it('should set US English to the request `locale` if one is not provided and the environment variable is not set', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 12345
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.sections.update)
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
                    zendeskId: 12345,
                    position: 42
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.sections.update)
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
                    zendeskId: 12345,
                    description: 'Description goes here'
                }
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.zendeskClient.sections.update)
                        .to.have.been.calledWith(sinon.match.any, {
                            section: sinon.match({
                                description: 'Description goes here'
                            })
                        });
                });
        });

        it('should sync each article passed in the `articles` array', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 12345
                }
            });
            section.sections = [
                testUtils.createArticle({section: section}),
                testUtils.createArticle({section: section})
            ];
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.syncArticleStub)
                        .to.have.been.calledTwice;
                });
        });

        it('should not sync any articles if no articles were provided', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 12345
                },
                articles: []
            });
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.sync()
                .then(() => {
                    expect(this.syncArticleStub)
                        .to.not.have.been.called;
                });
        });

        it('should reject with an error if an article sync returns an error', () => {
            const section = testUtils.createSection({
                meta: {
                    zendeskId: 12345
                }
            });
            const error = {error: 'error'};
            this.syncArticleStub.rejects(error);
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.sync())
                .to.be.rejectedWith(error);
        });

        describe('access policy', () => {
            it('should set the access policy for the correct section id', () => {
                const section = testUtils.createSection({
                    meta: {
                        zendeskId: 12345,
                        viewableBy: 'everyone',
                        manageableBy: 'everyone'
                    }
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.accesspolicies.update)
                            .to.have.been.calledWith(12345, sinon.match.any);
                    });
            });

            it('should reject the promise with an error if the accesspolicies api returns an error', () => {
                const section = testUtils.createSection({
                    meta: {
                        zendeskId: 12345,
                        viewableBy: 'everyone',
                        manageableBy: 'everyone'
                    }
                });
                const error = {error: 'error'};
                this.zendeskClient.accesspolicies.update.rejects(error);
                const uploader = new SectionUploader(section, this.zendeskClient);

                return expect(uploader.sync())
                            .to.be.rejectedWith(error);
            });

            it('should set the `viewable_by` property to the request', () => {
                const section = testUtils.createSection({
                    meta: {
                        zendeskId: 12345,
                        viewableBy: 'staff'
                    }
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.accesspolicies.update)
                            .to.have.been.calledWithMatch(sinon.match.any, {
                                'access_policy': sinon.match({
                                    'viewable_by': 'staff'
                                })
                            });
                    });
            });

            it('should set the `manageable_by` property to the request', () => {
                const section = testUtils.createSection({
                    meta: {
                        zendeskId: 12345,
                        manageableBy: 'everyone'
                    }
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.accesspolicies.update)
                            .to.have.been.calledWithMatch(sinon.match.any, {
                                'access_policy': sinon.match({
                                    'manageable_by': 'everyone'
                                })
                            });
                    });
            });
        });
    });
});

