const SectionUploader = require('../../../lib/zendesk-uploader/section-uploader');
const ArticleUploader = require('../../../lib/zendesk-uploader/article-uploader');
const logger = require('../../../lib/logger');
const testUtils = require('./test-utils');

describe('SectionUploader', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.sections = {
            create: sandbox.stub().resolves({id: 123456, position: 2}),
            update: sandbox.stub().resolves()
        };
        this.zendeskClient.translations = {
            updateForSection: sandbox.stub().resolves({id: 54321})
        };
        this.zendeskClient.accesspolicies = {
            update: sandbox.stub().resolves()
        };
        this.createArticleStub = sandbox.stub(ArticleUploader.prototype, 'create').resolves();
        this.syncArticleStub = sandbox.stub(ArticleUploader.prototype, 'sync').resolves();

        sandbox.stub(logger, 'info');
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('create', () => {
        it('should create a section if it doesnt exist', () => {
            const section = testUtils.createSection({isNew: true});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.have.been.called;
                });
        });

        it('should log create section action if section does not exist', () => {
            const category = testUtils.createSection({isNew: true, path: 'category/path'});
            const uploader = new SectionUploader(category, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(logger.info)
                        .to.have.been.calledWith(`Creating new section on ZenDesk: category/path`);
                });
        });

        it('should not create the section if it already exists', () => {
            const section = testUtils.createSection({isNew: false});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.zendeskClient.sections.create)
                        .to.not.have.been.called;
                });
        });

        it('should not log create section action if already exists', () => {
            const category = testUtils.createSection({isNew: false});
            const uploader = new SectionUploader(category, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(logger.info)
                        .to.have.been.not.called;
                });
        });

        it('should reject the promise when the create sections API returns an error', () => {
            let error = {
                error: 'error message'
            };
            this.zendeskClient.sections.create.rejects(error);
            const uploader = new SectionUploader(testUtils.createSection({isNew: true}), this.zendeskClient);

            return expect(uploader.create())
                .to.be.rejectedWith(error);
        });

        it('should set `locale` metadata to the request', () => {
            const section = testUtils.createSection({
                isNew: true,
                meta: {locale: 'test-locale'}
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

        it('should update the sections zendeskId meta property', () => {
            const section = testUtils.createSection({isNew: true});
            this.zendeskClient.sections.create.resolves({id: 123456, position: 42});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.update)
                        .to.have.been.calledWith({zendeskId: 123456});
                });
        });

        it('should write the metadata after it has been updated', () => {
            const section = testUtils.createSection({isNew: true});
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
            const section = testUtils.createSection({articles: []});
            const uploader = new SectionUploader(section, this.zendeskClient);

            return uploader.create()
                .then(() => {
                    expect(this.createArticleStub)
                        .to.not.have.been.called;
                });
        });

        it('should reject with an error if an article upload returns an error', () => {
            const section = testUtils.createSection({isNew: true});
            const error = {error: 'error'};
            this.createArticleStub.rejects(error);
            const uploader = new SectionUploader(section, this.zendeskClient);

            return expect(uploader.create())
                .to.be.rejectedWith(error);
        });
    });

    describe('sync', () => {
        describe('section update', () => {
            it('should update a section if it has been changed', () => {
                const section = testUtils.createSection({isChanged: true});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.sections.update)
                            .to.have.been.called;
                    });
            });

            it('should log update section action if section has been changed', () => {
                const section = testUtils.createSection({isChanged: true, path: 'section/path'});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(logger.info)
                            .to.have.been.calledWith('Synchronizing section on ZenDesk: section/path');
                    });
            });

            it('should not update a section if it has not been changed', () => {
                const section = testUtils.createSection({isChanged: false});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.sections.update)
                            .to.not.have.been.called;
                    });
            });

            it('should not log update section action if section has not been changed', () => {
                const section = testUtils.createSection({isChanged: false});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(logger.info)
                            .to.have.been.not.called;
                    });
            });

            it('should reject the promise when the update section update API returns an error', () => {
                const section = testUtils.createSection({isChanged: true});
                const error = {error: 'error message'};
                const uploader = new SectionUploader(section, this.zendeskClient);

                this.zendeskClient.sections.update.rejects(error);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });

            it('should update the correct section zendeskId', () => {
                const section = testUtils.createSection({
                    isChanged: true,
                    meta: {zendeskId: 12345}
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.sections.update)
                            .to.have.been.calledWithMatch(12345);
                    });
            });

            it('should set the section `position` to the request if one is provided', () => {
                const section = testUtils.createSection({
                    isChanged: true,
                    meta: {position: 42}
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
        });

        describe('translations update', () => {
            it('should update the translation if a section has changed', () => {
                const section = testUtils.createSection({isChanged: true});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForSection)
                            .to.have.been.called;
                    });
            });

            it('should not update the translation if a section has not changed', () => {
                const section = testUtils.createSection({isChanged: false});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForSection)
                            .to.not.have.been.called;
                    });
            });

            it('should reject the promise when the translations API returns an error', () => {
                const section = testUtils.createSection({isChanged: true});
                const error = {error: 'error message'};
                const uploader = new SectionUploader(section, this.zendeskClient);

                this.zendeskClient.translations.updateForSection.rejects(error);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });

            it('should update the translation for the correct zendeskId', () => {
                const section = testUtils.createSection({
                    isChanged: true,
                    meta: {zendeskId: 12345}
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForSection)
                            .to.have.been.calledWithMatch(12345);
                    });
            });

            it('should update the translation for the correct locale', () => {
                const section = testUtils.createSection({
                    isChanged: true,
                    meta: {locale: 'test-locale'}
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForSection)
                            .to.have.been.calledWithMatch(sinon.match.any, 'test-locale');
                    });
            });

            it('should set the locale to the request', () => {
                const section = testUtils.createSection({
                    isChanged: true,
                    meta: {locale: 'test-locale'}
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForSection)
                            .to.have.been.calledWithMatch(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    locale: 'test-locale'
                                })
                            });
                    });
            });

            it('should set the section description to the request if one is provided', () => {
                const section = testUtils.createSection({
                    isChanged: true,
                    meta: {description: 'Description goes here'}
                });
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.zendeskClient.translations.updateForSection)
                            .to.have.been.calledWithMatch(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    body: 'Description goes here'
                                })
                            });
                    });
            });
        });

        describe('access policy', () => {
            it('should set the access policy for the correct section id', () => {
                const section = testUtils.createSection({
                    isChanged: true,
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
                    isChanged: true,
                    meta: {
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
                    isChanged: true,
                    meta: {
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
                    isChanged: true,
                    meta: {
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

        describe('hash', () => {
            it('should update section hash after updating section if section was changed', () => {
                const section = testUtils.createSection({isChanged: true});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(section.updateHash).to.be.calledOnce;
                    });
            });

            it('should reject if failed to update section hash', () => {
                const section = testUtils.createSection({isChanged: true});
                const uploader = new SectionUploader(section, this.zendeskClient);
                const error = new Error('error');

                section.updateHash.rejects(error);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });

            it('should not update section hash if section has not been changed', () => {
                const section = testUtils.createSection({isChanged: false});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(section.updateHash).to.be.not.called;
                    });
            });
        });

        describe('article sync', () => {
            it('should sync each article passed in the `articles` array', () => {
                const section = testUtils.createSection();
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
                const section = testUtils.createSection({articles: []});
                const uploader = new SectionUploader(section, this.zendeskClient);

                return uploader.sync()
                    .then(() => {
                        expect(this.syncArticleStub)
                            .to.not.have.been.called;
                    });
            });

            it('should reject with an error if an article sync returns an error', () => {
                const section = testUtils.createSection();
                const error = {error: 'error'};
                this.syncArticleStub.rejects(error);
                const uploader = new SectionUploader(section, this.zendeskClient);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });
        });
    });
});
