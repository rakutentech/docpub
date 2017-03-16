const CategoryUploader = require('../../../lib/zendesk-uploader/category-uploader');
const SectionUploader = require('../../../lib/zendesk-uploader/section-uploader');
const logger = require('../../../lib/logger');
const testUtils = require('./test-utils');

describe('CategoryUploader', () => {
    const sandbox = sinon.sandbox.create();
    let zendeskClient;

    beforeEach(() => {
        zendeskClient = {
            categories: {
                create: sandbox.stub().resolves({id: 123456, position: 2}),
                update: sandbox.stub().resolves()
            },
            translations: {
                updateForCategory: sandbox.stub().resolves({id: 54321})
            }
        };

        sandbox.stub(SectionUploader.prototype, 'create').resolves();
        sandbox.stub(SectionUploader.prototype, 'sync').resolves();

        sandbox.stub(logger, 'info');
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('upload', () => {
        it('should create a category', () => {
            const category = testUtils.createCategory();
            const uploader = createUploader_(category);

            sandbox.stub(uploader, 'create').resolves();
            sandbox.stub(uploader, 'sync').resolves();

            return uploader.upload()
                .then(() => {
                    expect(uploader.create)
                        .to.have.been.called;
                });
        });

        it('should sync a category', () => {
            const category = testUtils.createCategory();
            const uploader = createUploader_(category);

            sandbox.stub(uploader, 'create').resolves();
            sandbox.stub(uploader, 'sync').resolves();

            return uploader.upload()
                .then(() => {
                    expect(uploader.sync)
                        .to.have.been.called;
                });
        });
    });

    describe('create', () => {
        it('should create a category if it does not exist', () => {
            const category = testUtils.createCategory({isNew: true});
            const uploader = createUploader_(category);

            return uploader.create()
                .then(() => {
                    expect(zendeskClient.categories.create)
                        .to.have.been.called;
                });
        });

        it('should log create category action if category does not exist', () => {
            const category = testUtils.createCategory({isNew: true, path: 'category/path'});
            const uploader = createUploader_(category);

            return uploader.create()
                .then(() => {
                    expect(logger.info)
                        .to.have.been.calledWith(`Creating new category on ZenDesk: category/path`);
                });
        });

        it('should not create the category if it already exists', () => {
            const category = testUtils.createCategory({
                isNew: false
            });
            const uploader = createUploader_(category);

            return uploader.create()
                .then(() => {
                    expect(zendeskClient.categories.create)
                        .to.not.have.been.called;
                });
        });

        it('should not log create category action if category is not new', () => {
            const category = testUtils.createCategory({isNew: false});
            const uploader = createUploader_(category);

            return uploader.create()
                .then(() => {
                    expect(logger.info)
                        .to.have.been.not.called;
                });
        });

        it('should reject the promise when the create category API returns an error', () => {
            const category = testUtils.createCategory({isNew: true});
            const uploader = createUploader_(category);

            zendeskClient.categories.create.rejects('error');

            return expect(uploader.create())
                .to.be.rejectedWith('error');
        });

        it('should set `locale` metadata to the request', () => {
            const category = testUtils.createCategory({
                isNew: true,
                meta: {locale: 'test-locale'}
            });
            const uploader = createUploader_(category);

            return uploader.create()
                .then(() => {
                    expect(zendeskClient.categories.create)
                        .to.have.been.calledWith({
                            category: sinon.match({
                                locale: 'test-locale'
                            })
                        });
                });
        });

        it('should update the categorys zendeskId meta property', () => {
            const category = testUtils.createCategory({isNew: true});
            const uploader = createUploader_(category);

            zendeskClient.categories.create.resolves({id: 123456, position: 42});

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.update)
                        .to.have.been.calledWith({zendeskId: 123456});
                });
        });

        it('should write the metadata after it has been updated', () => {
            const category = testUtils.createCategory({isNew: true});
            const uploader = createUploader_(category);

            zendeskClient.categories.create.resolves({id: 123456, position: 42});

            return uploader.create()
                .then(() => {
                    expect(uploader.meta.write)
                        .to.have.been.calledAfter(uploader.meta.update);
                });
        });

        it('should create each section passed in the `sections` array', () => {
            const category = testUtils.createCategory({isNew: true});
            const uploader = createUploader_(category);

            category.sections = [
                testUtils.createSection({isNew: true, category: category}),
                testUtils.createSection({isNew: true, category: category})
            ];

            return uploader.create()
                .then(() => {
                    expect(SectionUploader.prototype.create)
                        .to.have.been.calledTwice;
                });
        });

        it('should not create any sections if no sections were provided', () => {
            const category = testUtils.createCategory({isNew: true, sections: []});
            const uploader = createUploader_(category);

            return uploader.create()
                .then(() => {
                    expect(SectionUploader.prototype.create)
                        .to.not.have.been.called;
                });
        });

        it('should reject with an error if a section creation returns an error', () => {
            const category = testUtils.createCategory({isNew: true});
            const uploader = createUploader_(category);

            SectionUploader.prototype.create.rejects('error');

            return expect(uploader.create()).to.be.rejectedWith('error');
        });
    });

    describe('sync', () => {
        describe('category update', () => {
            it('should update a category if it has been changed', () => {
                const category = testUtils.createCategory({isChanged: true});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.categories.update)
                            .to.have.been.called;
                    });
            });

            it('should log update category action if category changed', () => {
                const category = testUtils.createCategory({isChanged: true, path: 'category/path'});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(logger.info)
                            .to.have.been.calledWith(`Synchronizing category on ZenDesk: category/path`);
                    });
            });

            it('should not update a category if it has not been changed', () => {
                const category = testUtils.createCategory({isChanged: false});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.categories.update)
                            .to.not.have.been.called;
                    });
            });

            it('should not log update category action if was not changed', () => {
                const category = testUtils.createCategory({isChanged: false});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(logger.info)
                            .to.be.not.called;
                    });
            });

            it('should update the correct category zendeskId', () => {
                const category = testUtils.createCategory({
                    isChanged: true,
                    meta: {zendeskId: 12345}
                });
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.categories.update)
                            .to.have.been.calledWithMatch(12345);
                    });
            });

            it('should reject the promise when the update category API returns an error', () => {
                const category = testUtils.createCategory({isChanged: true});
                const uploader = createUploader_(category);

                zendeskClient.categories.update.rejects('error');

                return expect(uploader.sync()).to.be.rejectedWith('error');
            });

            it('should set the category `position` to the request if one is provided', () => {
                const category = testUtils.createCategory({
                    isChanged: true,
                    meta: {position: 42}
                });
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.categories.update)
                            .to.have.been.calledWith(sinon.match.any, {
                                category: sinon.match({
                                    position: 42
                                })
                            });
                    });
            });
        });

        describe('translation update', () => {
            it('should update the translation if the category has changed', () => {
                const category = testUtils.createCategory({isChanged: true});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.translations.updateForCategory)
                            .to.have.been.called;
                    });
            });

            it('should not update the translation if the category has not changed', () => {
                const category = testUtils.createCategory({isChanged: false});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.translations.updateForCategory)
                            .to.not.have.been.called;
                    });
            });

            it('should update the translation for the correct category zendeskId', () => {
                const category = testUtils.createCategory({
                    isChanged: true,
                    meta: {zendeskId: 12345}
                });
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.translations.updateForCategory)
                            .to.have.been.calledWithMatch(12345);
                    });
            });

            it('should reject the promise when the translation API returns an error', () => {
                const category = testUtils.createCategory({isChanged: true});
                const uploader = createUploader_(category);

                zendeskClient.translations.updateForCategory.rejects('error');

                return expect(uploader.sync())
                    .to.be.rejectedWith('error');
            });

            it('should update the translation for the correct locale', () => {
                const category = testUtils.createCategory({
                    isChanged: true,
                    meta: {
                        locale: 'test-locale'
                    }
                });
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.translations.updateForCategory)
                            .to.have.been.calledWithMatch(sinon.match.any, 'test-locale');
                    });
            });

            it('should set the locale to the request', () => {
                const category = testUtils.createCategory({
                    isChanged: true,
                    meta: {locale: 'test-locale'}
                });
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.translations.updateForCategory)
                            .to.have.been.calledWithMatch(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    locale: 'test-locale'
                                })
                            });
                    });
            });

            it('should set the category title to the request', () => {
                const category = testUtils.createCategory({
                    isChanged: true,
                    meta: {title: 'Test Title'}
                });
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.translations.updateForCategory)
                            .to.have.been.calledWithMatch(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    title: 'Test Title'
                                })
                            });
                    });
            });

            it('should set the category description to the request if one is provided', () => {
                const category = testUtils.createCategory({
                    isChanged: true,
                    meta: {description: 'Description goes here'}
                });
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(zendeskClient.translations.updateForCategory)
                            .to.have.been.calledWithMatch(sinon.match.any, sinon.match.any, {
                                translation: sinon.match({
                                    body: 'Description goes here'
                                })
                            });
                    });
            });
        });

        describe('hash', () => {
            it('should update category hash after updating category if category was changed', () => {
                const category = testUtils.createCategory({isChanged: true});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(category.updateHash).to.be.calledOnce;
                    });
            });

            it('should reject if failed to update category hash', () => {
                const category = testUtils.createCategory({isChanged: true});
                const uploader = createUploader_(category);
                const error = new Error('error');

                category.updateHash.rejects(error);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });

            it('should not update category hash if category has not been changed', () => {
                const category = testUtils.createCategory({isChanged: false});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(category.updateHash).to.be.not.called;
                    });
            });
        });

        describe('section sync', () => {
            it('should sync each section passed in the `sections` array', () => {
                const category = testUtils.createCategory();
                category.sections = [
                    testUtils.createSection({category: category}),
                    testUtils.createSection({category: category})
                ];
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(SectionUploader.prototype.sync)
                            .to.have.been.calledTwice;
                    });
            });

            it('should not sync any sections if no sections were provided', () => {
                const category = testUtils.createCategory({sections: []});
                const uploader = createUploader_(category);

                return uploader.sync()
                    .then(() => {
                        expect(SectionUploader.prototype.sync)
                            .to.not.have.been.called;
                    });
            });

            it('should reject with an error if a section sync returns an error', () => {
                const category = testUtils.createCategory();
                const error = {error: 'error'};
                SectionUploader.prototype.sync.rejects(error);
                const uploader = createUploader_(category);

                return expect(uploader.sync())
                    .to.be.rejectedWith(error);
            });
        });
    });

    function createUploader_(category) {
        const config = testUtils.createDummyConfig();

        return new CategoryUploader(category, config, zendeskClient);
    }
});
