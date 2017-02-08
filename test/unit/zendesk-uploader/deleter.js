const ZendeskDeleter = require('../../../lib/zendesk-uploader/deleter');
const apiUtils = require('../../../lib/zendesk-uploader/api-utils');
const testUtils = require('./test-utils');

describe('Deleter', () => {
    const sandbox = sinon.sandbox.create();
    beforeEach(() => {
        this.zendeskClient = sandbox.stub();
        this.zendeskClient.sections = {
            listByCategory: sandbox.stub().resolves([]),
            delete: sandbox.stub().resolves()
        };
        this.zendeskClient.articles = {
            listByCategory: sandbox.stub().resolves([]),
            delete: sandbox.stub().resolves()
        };
    });
    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should not initialize an instance of zendesk client if one was already passed with the constructor', () => {
            const zendeskClient = sinon.stub().returns({});
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([]);
            sandbox.spy(apiUtils, 'getClient');
            /*eslint-disable no-new*/
            new ZendeskDeleter(category, zendeskClient);
            /*eslint-enable no-new*/

            expect(apiUtils.getClient)
                .to.not.have.been.called;
        });
    });

    describe('delete', () => {
        it('should return a promise on success', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([]);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return expect(deleter.delete())
                .to.be.fulfilled;
        });

        it('should reject with an error when the API returns an error', () => {
            const category = testUtils.createCategory();
            const error = {error: 'error'};
            category.listDocuments = sandbox.stub().returns([]);
            this.zendeskClient.articles.listByCategory.resolves([{id: 123456}]);
            this.zendeskClient.articles.delete.rejects(error);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return expect(deleter.delete())
                .to.be.rejectedWith(error);
        });

        it('should delete all articles that exist on zendesk but not in the Category tree', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([
                testUtils.createArticle({
                    meta: {zendeskId: 123456}
                })
            ]);
            this.zendeskClient.articles.listByCategory.resolves([{id: 123456}, {id: 876543}, {id: 751368}]);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return deleter.delete()
                .then(() => {
                    expect(this.zendeskClient.articles.delete)
                        .to.have.been.calledTwice
                        .and.to.have.been.calledWith(751368)
                        .and.to.have.been.calledWith(876543);
                });
        });

        it('should not delete any articles that exist in the category tree', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([
                testUtils.createArticle({
                    meta: {zendeskId: 123456}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 654321}
                })
            ]);
            this.zendeskClient.articles.listByCategory.resolves([{id: 123456}, {id: 654321}, {id: 751368}]);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return deleter.delete()
                .then(() => {
                    expect(this.zendeskClient.articles.delete)
                        .to.not.have.been.calledWith(123456)
                        .and.to.not.have.been.calledWith(654321);
                });
        });

        it('should delete all sections that exist on zendesk but not in the Category tree', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                })
            ]);
            this.zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 6541321}, {id: 123456}]);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return deleter.delete()
                .then(() => {
                    expect(this.zendeskClient.sections.delete)
                        .to.have.been.calledTwice
                        .and.to.have.been.calledWith(6541321)
                        .and.to.have.been.calledWith(123456);
                });
        });

        it('should not delete any sections that exist in the Category Tree', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createSection({
                    meta: {zendeskId: 15697}
                })
            ]);
            this.zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 15697}, {id: 123456}]);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return deleter.delete()
                .then(() => {
                    expect(this.zendeskClient.sections.delete)
                        .to.not.have.been.calledWith(1981)
                        .and.to.not.have.been.calledWith(15697);
                });
        });

        it('should not delete any sections if there are no sections to delete but should still delete articles', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 54874}
                })
            ]);
            this.zendeskClient.sections.listByCategory.resolves([{id: 1981}]);
            this.zendeskClient.articles.listByCategory.resolves([{id: 54874}, {id: 1496489}]);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return deleter.delete()
                .then(() => {
                    expect(this.zendeskClient.sections.delete)
                        .to.not.have.been.called;
                    expect(this.zendeskClient.articles.delete)
                        .to.have.been.calledWith(1496489);
                });
        });

        it('should not delete any articles if there are no articles to delete but should still delete sections', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 54874}
                })
            ]);
            this.zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 1496489}]);
            this.zendeskClient.articles.listByCategory.resolves([{id: 54874}]);
            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return deleter.delete()
                .then(() => {
                    expect(this.zendeskClient.articles.delete)
                        .to.not.have.been.called;
                    expect(this.zendeskClient.sections.delete)
                        .to.have.been.calledWith(1496489);
                });
        });

        it('should delete sections followed by articles', () => {
            const category = testUtils.createCategory();
            category.listDocuments = sandbox.stub().returns([
                testUtils.createSection({
                    meta: {zendeskId: 1981}
                }),
                testUtils.createArticle({
                    meta: {zendeskId: 54874}
                })
            ]);
            this.zendeskClient.sections.listByCategory.resolves([{id: 1981}, {id: 6541321}]);
            this.zendeskClient.articles.listByCategory.resolves([{id: 54874}, {id: 1496489}]);
            this.zendeskClient.sections.delete.returns(new Promise(resolve => {
                expect(this.zendeskClient.articles.delete)
                    .to.not.have.been.called;
                resolve();
            }));

            const deleter = new ZendeskDeleter(category, this.zendeskClient);

            return deleter.delete()
                .then(() => {
                    expect(this.zendeskClient.sections.delete)
                        .to.have.been.calledBefore(this.zendeskClient.articles.delete);
                });
        });
    });
});
