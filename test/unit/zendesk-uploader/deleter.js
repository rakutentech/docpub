const ZendeskDeleter = require('../../../lib/zendesk-uploader/deleter');
const apiUtils = require('../../../lib/zendesk-uploader/api-utils');
const logger = require('../../../lib/logger');
const testUtils = require('./test-utils');

describe('Deleter', () => {
    const sandbox = sinon.sandbox.create();
    let zendeskClient;

    beforeEach(() => {
        zendeskClient = {
            sections: {
                listByCategory: sandbox.stub().resolves([]),
                delete: sandbox.stub().resolves()
            },
            articles: {
                listByCategory: sandbox.stub().resolves([]),
                delete: sandbox.stub().resolves()
            }
        };

        sandbox.stub(logger, 'info');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should not initialize an instance of zendesk client if one was already passed with the constructor', () => {
            const category = testUtils.createCategory();

            sandbox.stub(apiUtils, 'getClient');
            /*eslint-disable no-new*/
            createDeleter_(category);
            /*eslint-enable no-new*/

            expect(apiUtils.getClient).to.not.have.been.called;
        });
    });

    describe('delete', () => {
        it('should return a promise on success', () => {
            const category = testUtils.createCategory();
            const deleter = createDeleter_(category);

            return expect(deleter.delete())
                .to.be.fulfilled;
        });

        it('should reject with an error when the API returns an error', () => {
            const category = testUtils.createCategory();
            const deleter = createDeleter_(category);

            zendeskClient.articles.listByCategory.resolves([{id: 123456}]);
            zendeskClient.articles.delete.rejects('error');

            return expect(deleter.delete()).to.be.rejectedWith('error');
        });

        it('should log delete action', () => {
            const category = testUtils.createCategory();
            const deleter = createDeleter_(category);

            return deleter.delete()
                .then(() => {
                    expect(logger.info).to.be.calledWith('Removing dangling entities from ZenDesk');
                });
        });

        it('should delete all articles that exist on zendesk but not in the Category tree', () => {
            const category = testUtils.createCategory();
            category.flatTree.returns([
                testUtils.createArticle({
                    meta: {zendeskId: 123456}
                })
            ]);

            const deleter = createDeleter_(category);

            zendeskClient.articles.listByCategory.resolves([{id: 123456}, {id: 876543}, {id: 751368}]);

            return deleter.delete()
                .then(() => {
                    expect(zendeskClient.articles.delete)
                        .to.have.been.calledTwice
                        .and.to.have.been.calledWith(751368)
                        .and.to.have.been.calledWith(876543);
                });
        });

        it('should not delete any articles that exist in the category tree', () => {
            const category = testUtils.createCategory();
            category.flatTree.returns([
                testUtils.createArticle({
                    meta: {zendeskId: 123456}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 654321}
                })
            ]);

            const deleter = createDeleter_(category);

            zendeskClient.articles.listByCategory.resolves([{id: 123456}, {id: 654321}, {id: 751368}]);

            return deleter.delete()
                .then(() => {
                    expect(zendeskClient.articles.delete)
                        .to.not.have.been.calledWith(123456)
                        .and.to.not.have.been.calledWith(654321);
                });
        });

        it('should delete all sections that exist on zendesk but not in the Category tree', () => {
            const category = testUtils.createCategory();
            category.flatTree.returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                })
            ]);

            const deleter = createDeleter_(category);

            zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 6541321}, {id: 123456}]);

            return deleter.delete()
                .then(() => {
                    expect(zendeskClient.sections.delete)
                        .to.have.been.calledTwice
                        .and.to.have.been.calledWith(6541321)
                        .and.to.have.been.calledWith(123456);
                });
        });

        it('should not delete any sections that exist in the Category Tree', () => {
            const category = testUtils.createCategory();
            category.flatTree.returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createSection({
                    meta: {zendeskId: 15697}
                })
            ]);

            const deleter = createDeleter_(category);

            zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 15697}, {id: 123456}]);

            return deleter.delete()
                .then(() => {
                    expect(zendeskClient.sections.delete)
                        .to.not.have.been.calledWith(1981)
                        .and.to.not.have.been.calledWith(15697);
                });
        });

        it('should not delete any sections if there are no sections to delete but should still delete articles', () => {
            const category = testUtils.createCategory();
            category.flatTree.returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 54874}
                })
            ]);

            const deleter = createDeleter_(category);

            zendeskClient.sections.listByCategory.resolves([{id: 1981}]);
            zendeskClient.articles.listByCategory.resolves([{id: 54874}, {id: 1496489}]);

            return deleter.delete()
                .then(() => {
                    expect(zendeskClient.sections.delete)
                        .to.not.have.been.called;
                    expect(zendeskClient.articles.delete)
                        .to.have.been.calledWith(1496489);
                });
        });

        it('should not delete any articles if there are no articles to delete but should still delete sections', () => {
            const category = testUtils.createCategory();
            category.flatTree.returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 54874}
                })
            ]);

            const deleter = createDeleter_(category);

            zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 1496489}]);
            zendeskClient.articles.listByCategory.resolves([{id: 54874}]);

            return deleter.delete()
                .then(() => {
                    expect(zendeskClient.articles.delete)
                        .to.not.have.been.called;
                    expect(zendeskClient.sections.delete)
                        .to.have.been.calledWith(1496489);
                });
        });

        it('should delete sections followed by articles', () => {
            const category = testUtils.createCategory();
            category.flatTree.returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 54874}
                })
            ]);

            const deleter = createDeleter_(category);

            zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 6541321}]);
            zendeskClient.articles.listByCategory.resolves([{id: 54874}, {id: 1496489}]);
            zendeskClient.sections.delete.returns(new Promise(resolve => {
                expect(zendeskClient.articles.delete).to.not.have.been.called;

                resolve();
            }));

            return deleter.delete()
                .then(() => {
                    expect(zendeskClient.sections.delete)
                        .to.have.been.calledBefore(zendeskClient.articles.delete);
                });
        });
    });

    function createDeleter_(category) {
        const config = testUtils.createDummyConfig();

        return new ZendeskDeleter(category, config, zendeskClient);
    }
});
